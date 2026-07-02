import {
    BadRequestError,
    ConflictError,
} from '../../../../shared/domain/errors'
import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    CreatePayrollProvisionInput,
    PayrollProvisionFinancialPort,
} from '../../application/ports/payroll-provision-financial.port'
import type { PayrollProvisionEntity } from '../../domain/entities/hr.entity'

type PayrollProvisionRow = {
    id: string
    organization_id: string
    year: number
    month: number
    amount: string
    employee_count: number
    financial_payable_id: string
    created_at: Date
}

export class PostgresPayrollProvisionFinancialPort implements PayrollProvisionFinancialPort {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async createPayrollProvision(
        input: CreatePayrollProvisionInput,
    ): Promise<PayrollProvisionEntity> {
        return this.databaseClient.transaction(async (client) => {
            await this.ensureFinancialReferences(client, input)

            const payroll = await this.calculatePayroll(client, input)
            const financialPayableId = await this.createFinancialPayable(
                client,
                input,
                payroll.amount,
            )

            try {
                return await this.insertPayrollProvision(client, {
                    ...input,
                    amount: payroll.amount,
                    employeeCount: payroll.employeeCount,
                    financialPayableId,
                })
            } catch (error) {
                if (isPayrollProvisionPeriodUniqueViolation(error)) {
                    throw new ConflictError('Provisao da competencia ja existe')
                }

                throw error
            }
        })
    }

    private async ensureFinancialReferences(
        client: DatabaseClient,
        input: CreatePayrollProvisionInput,
    ): Promise<void> {
        const [account] = await client.select<{ found: boolean }>(
            `
                SELECT EXISTS (
                    SELECT 1 FROM financial_accounts
                    WHERE id = :accountId
                        AND organization_id = :organizationId
                        AND status = 'ACTIVE'
                        AND deleted_at IS NULL
                ) AS found
            `,
            input,
        )

        if (!account?.found) {
            throw new BadRequestError('Conta financeira invalida')
        }

        const [category] = await client.select<{ found: boolean }>(
            `
                SELECT EXISTS (
                    SELECT 1 FROM financial_categories
                    WHERE id = :categoryId
                        AND organization_id = :organizationId
                        AND type = 'EXPENSE'
                        AND status = 'ACTIVE'
                        AND deleted_at IS NULL
                ) AS found
            `,
            input,
        )

        if (!category?.found) {
            throw new BadRequestError('Categoria financeira invalida')
        }
    }

    private async calculatePayroll(
        client: DatabaseClient,
        input: CreatePayrollProvisionInput,
    ): Promise<{ amount: string; employeeCount: number }> {
        const [payroll] = await client.select<{
            amount: string
            employee_count: string
        }>(
            `
                SELECT
                    COALESCE(SUM(current_salary), 0)::TEXT AS amount,
                    COUNT(*)::TEXT AS employee_count
                FROM hr_employees
                WHERE organization_id = :organizationId
                    AND status = 'ACTIVE'
                    AND deleted_at IS NULL
            `,
            input,
        )

        if (!payroll || Number(payroll.employee_count) === 0) {
            throw new BadRequestError(
                'Nao ha colaboradores ativos para provisionar',
            )
        }

        return {
            amount: payroll.amount,
            employeeCount: Number(payroll.employee_count),
        }
    }

    private async createFinancialPayable(
        client: DatabaseClient,
        input: CreatePayrollProvisionInput,
        amount: string,
    ): Promise<string> {
        const competence = `${String(input.month).padStart(2, '0')}/${input.year}`
        const description = `Provisao de folha - ${competence}`
        const notes =
            'Valor gerado pelo RH com base apenas nos salarios atuais dos colaboradores ativos. Nao inclui encargos, beneficios, descontos, ferias, 13o ou rescisoes.'

        const [transaction] = await client.query<{ id: string }>(
            `
                INSERT INTO financial_transactions (
                    organization_id, account_id, category_id, description,
                    notes, type, amount, transaction_date, due_date,
                    status, created_by
                )
                VALUES (
                    :organizationId, :accountId, :categoryId, :description,
                    :notes, 'EXPENSE', :amount, :transactionDate, :dueDate,
                    'PENDING', :createdBy
                )
                RETURNING id
            `,
            {
                ...input,
                description,
                notes,
                amount,
                transactionDate: `${input.year}-${String(input.month).padStart(2, '0')}-01`,
            },
        )

        return transaction.id
    }

    private async insertPayrollProvision(
        client: DatabaseClient,
        input: CreatePayrollProvisionInput & {
            amount: string
            employeeCount: number
            financialPayableId: string
        },
    ): Promise<PayrollProvisionEntity> {
        const [provision] = await client.query<PayrollProvisionRow>(
            `
                INSERT INTO hr_payroll_provisions (
                    organization_id, year, month, amount, employee_count,
                    financial_payable_id, created_by
                )
                VALUES (
                    :organizationId, :year, :month, :amount, :employeeCount,
                    :financialPayableId, :createdBy
                )
                RETURNING *
            `,
            input,
        )

        return toPayrollProvision(provision)
    }
}

function toPayrollProvision(row: PayrollProvisionRow): PayrollProvisionEntity {
    return {
        id: row.id,
        organizationId: row.organization_id,
        year: row.year,
        month: row.month,
        amount: row.amount,
        employeeCount: Number(row.employee_count),
        financialPayableId: row.financial_payable_id,
        createdAt: row.created_at,
    }
}

function isPayrollProvisionPeriodUniqueViolation(error: unknown): boolean {
    const databaseError = error as {
        parent?: { code?: string; constraint?: string }
        original?: { code?: string; constraint?: string }
    }
    const parent = databaseError.parent ?? databaseError.original

    return (
        parent?.code === '23505' &&
        parent.constraint === 'hr_payroll_provisions_period_unique'
    )
}
