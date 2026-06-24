import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    LoanBorrowerType,
    LoanChargeEntity,
    LoanChargeType,
    LoanEntity,
    LoanEventItemEntity,
    LoanItemEntity,
    LoanOccurrenceEntity,
    LoanOccurrenceType,
    LoanReturnEntity,
    LoanStatus,
} from '../../domain/entities/loan.entity'
import type {
    LoanChargeData,
    LoanFilters,
    LoanItemData,
    LoanRepository,
} from '../../domain/repositories/loan.repository'

type LoanRow = {
    id: string
    organization_id: string
    borrower_type: LoanBorrowerType
    customer_id: string | null
    customer_name: string | null
    employee_id: string | null
    employee_name: string | null
    status: LoanStatus
    expected_return_date: string
    is_overdue: boolean
    released_at: Date | null
    completed_at: Date | null
    canceled_at: Date | null
    notes: string | null
    created_by: string
    creator_name: string
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

type LoanItemRow = {
    id: string
    organization_id: string
    loan_id: string
    variant_id: string
    product_name: string
    variant_name: string
    variant_sku: string
    quantity_released: string
    quantity_returned: string
    quantity_lost: string
    quantity_damaged: string
    pending_quantity: string
    unit_cost_snapshot: string
    notes: string | null
}

type VariantRow = {
    id: string
    product_id: string
    current_quantity: string
    average_cost: string
}

type ReturnRow = {
    id: string
    organization_id: string
    loan_id: string
    returned_at: Date
    notes: string | null
    created_by: string
    created_at: Date
}

type OccurrenceRow = {
    id: string
    organization_id: string
    loan_id: string
    type: LoanOccurrenceType
    occurred_at: Date
    description: string | null
    created_by: string
    created_at: Date
}

type EventItemRow = {
    id: string
    loan_item_id: string
    quantity: string
}

type ChargeRow = {
    id: string
    organization_id: string
    loan_id: string
    occurrence_id: string | null
    financial_transaction_id: string | null
    type: LoanChargeType
    category_id: string
    amount: string
    due_date: string
    description: string
    canceled_at: Date | null
    created_at: Date
}

const loanSelect = `
    SELECT
        loans.*,
        customers.name AS customer_name,
        employees.name AS employee_name,
        users.name AS creator_name,
        (
            loans.status IN ('RELEASED', 'PARTIALLY_RETURNED')
            AND loans.expected_return_date < CURRENT_DATE
            AND EXISTS (
                SELECT 1
                FROM loan_items pending_items
                WHERE pending_items.loan_id = loans.id
                    AND (
                        pending_items.quantity_released
                        - pending_items.quantity_returned
                        - pending_items.quantity_lost
                        - pending_items.quantity_damaged
                    ) > 0
            )
        ) AS is_overdue
    FROM loans
    LEFT JOIN customers
        ON customers.id = loans.customer_id
    LEFT JOIN hr_employees employees
        ON employees.id = loans.employee_id
    INNER JOIN users
        ON users.id = loans.created_by
`

export class PostgresLoanRepository implements LoanRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async createLoan(input: {
        organizationId: string
        borrowerType: LoanBorrowerType
        customerId: string | null
        employeeId: string | null
        expectedReturnDate: string
        notes: string | null
        items: LoanItemData[]
        createdBy: string
    }): Promise<LoanEntity> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const [loan] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO loans (
                        organization_id, borrower_type, customer_id,
                        employee_id, expected_return_date, notes, created_by
                    )
                    VALUES (
                        :organizationId, :borrowerType, :customerId,
                        :employeeId, :expectedReturnDate, :notes, :createdBy
                    )
                    RETURNING id
                `,
                input,
            )
            for (const item of input.items) {
                await databaseClient.query(
                    `
                        INSERT INTO loan_items (
                            organization_id, loan_id, variant_id,
                            quantity_released, notes
                        )
                        VALUES (
                            :organizationId, :loanId, :variantId,
                            :quantity, :notes
                        )
                    `,
                    {
                        organizationId: input.organizationId,
                        loanId: loan.id,
                        ...item,
                    },
                )
            }
            return (await this.selectLoan(databaseClient, {
                id: loan.id,
                organizationId: input.organizationId,
            }))!
        })
    }

    async listLoans(
        filters: LoanFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const { where, replacements } = this.filters(filters)
        const offset = (pagination.page - 1) * pagination.pageSize
        const ids = await this.databaseClient.select<{ id: string }>(
            `
                ${loanSelect}
                ${where}
                ORDER BY loans.created_at DESC
                LIMIT :pageSize OFFSET :offset
            `,
            { ...replacements, pageSize: pagination.pageSize, offset },
        )
        const [count] = await this.databaseClient.select<{ total: string }>(
            `
                SELECT COUNT(*)::TEXT AS total
                FROM (${loanSelect} ${where}) counted
            `,
            replacements,
        )
        const items = await Promise.all(
            ids.map((row) =>
                this.findLoanById({
                    id: row.id,
                    organizationId: filters.organizationId,
                }),
            ),
        )
        return {
            items: items.filter((item): item is LoanEntity => item !== null),
            total: Number(count.total),
        }
    }

    findLoanById(input: { id: string; organizationId: string }) {
        return this.selectLoan(this.databaseClient, input)
    }

    async updateDraft(input: {
        id: string
        organizationId: string
        borrowerType: LoanBorrowerType
        customerId: string | null
        employeeId: string | null
        expectedReturnDate: string
        notes: string | null
        items: LoanItemData[]
    }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            const rows = await databaseClient.query<{ id: string }>(
                `
                    UPDATE loans
                    SET borrower_type = :borrowerType,
                        customer_id = :customerId,
                        employee_id = :employeeId,
                        expected_return_date = :expectedReturnDate,
                        notes = :notes,
                        updated_at = NOW()
                    WHERE id = :id
                        AND organization_id = :organizationId
                        AND status = 'DRAFT'
                        AND deleted_at IS NULL
                    RETURNING id
                `,
                input,
            )
            if (!rows.length) return null
            await databaseClient.query(
                `
                    DELETE FROM loan_items
                    WHERE loan_id = :id
                        AND organization_id = :organizationId
                `,
                input,
            )
            for (const item of input.items) {
                await databaseClient.query(
                    `
                        INSERT INTO loan_items (
                            organization_id, loan_id, variant_id,
                            quantity_released, notes
                        )
                        VALUES (
                            :organizationId, :loanId, :variantId,
                            :quantity, :notes
                        )
                    `,
                    {
                        organizationId: input.organizationId,
                        loanId: input.id,
                        ...item,
                    },
                )
            }
            return this.selectLoan(databaseClient, input)
        })
    }

    async releaseLoan(input: {
        id: string
        organizationId: string
        releasedAt: Date
        createdBy: string
        initialCharge: LoanChargeData | null
    }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            const loan = await this.lockLoan(databaseClient, input)
            if (loan.status !== 'DRAFT')
                throw new ConflictError('Emprestimo nao esta em rascunho')
            const items = await this.lockItems(databaseClient, input)
            for (const item of items) {
                const variant = await this.lockVariant(databaseClient, {
                    organizationId: input.organizationId,
                    variantId: item.variant_id,
                })
                if (
                    Number(variant.current_quantity) <
                    Number(item.quantity_released)
                )
                    throw new ConflictError('Estoque insuficiente')
                await databaseClient.query(
                    `
                        UPDATE loan_items
                        SET unit_cost_snapshot = :averageCost,
                            updated_at = NOW()
                        WHERE id = :itemId
                    `,
                    { itemId: item.id, averageCost: variant.average_cost },
                )
                await this.moveInventory(databaseClient, {
                    organizationId: input.organizationId,
                    productId: variant.product_id,
                    variantId: variant.id,
                    type: 'EXIT',
                    purpose: 'LOAN_RELEASE',
                    quantity: `-${item.quantity_released}`,
                    unitCost: variant.average_cost,
                    originId: input.id,
                    originItemId: item.id,
                    reason: 'Liberacao de emprestimo',
                    notes: null,
                    movementDate: input.releasedAt,
                    createdBy: input.createdBy,
                })
            }
            await databaseClient.query(
                `
                    UPDATE loans
                    SET status = 'RELEASED',
                        released_at = :releasedAt,
                        updated_at = NOW()
                    WHERE id = :id
                        AND organization_id = :organizationId
                `,
                input,
            )
            if (input.initialCharge) {
                await this.insertCharge(databaseClient, {
                    loan,
                    charge: input.initialCharge,
                    createdBy: input.createdBy,
                })
            }
            return (await this.selectLoan(databaseClient, input))!
        })
    }

    async cancelDraft(input: { id: string; organizationId: string }) {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE loans
                SET status = 'CANCELED',
                    canceled_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND status = 'DRAFT'
                    AND deleted_at IS NULL
                RETURNING id
            `,
            input,
        )
        return rows.length ? this.findLoanById(input) : null
    }

    createReturn(input: {
        id: string
        organizationId: string
        returnedAt: Date
        notes: string | null
        createdBy: string
        idempotencyKey: string | null
        items: Array<{ loanItemId: string; quantity: string }>
    }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            const existing = await this.findExistingEvent(databaseClient, {
                table: 'loan_returns',
                loanId: input.id,
                organizationId: input.organizationId,
                idempotencyKey: input.idempotencyKey,
            })
            if (existing) return (await this.selectLoan(databaseClient, input))!
            await this.ensureReleased(databaseClient, input)
            const [event] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO loan_returns (
                        organization_id, loan_id, returned_at, notes,
                        created_by, idempotency_key
                    )
                    VALUES (
                        :organizationId, :id, :returnedAt, :notes,
                        :createdBy, :idempotencyKey
                    )
                    RETURNING id
                `,
                input,
            )
            for (const item of input.items) {
                const loanItem = await this.lockItem(databaseClient, {
                    loanItemId: item.loanItemId,
                    loanId: input.id,
                    organizationId: input.organizationId,
                })
                this.assertPending(loanItem, item.quantity)
                await databaseClient.query(
                    `
                        INSERT INTO loan_return_items (
                            organization_id, loan_return_id, loan_item_id,
                            quantity
                        )
                        VALUES (
                            :organizationId, :eventId, :loanItemId, :quantity
                        )
                    `,
                    {
                        organizationId: input.organizationId,
                        eventId: event.id,
                        ...item,
                    },
                )
                await databaseClient.query(
                    `
                        UPDATE loan_items
                        SET quantity_returned =
                                quantity_returned + CAST(:quantity AS NUMERIC),
                            updated_at = NOW()
                        WHERE id = :loanItemId
                    `,
                    item,
                )
                const variant = await this.lockVariant(databaseClient, {
                    organizationId: input.organizationId,
                    variantId: loanItem.variant_id,
                })
                await this.moveInventory(databaseClient, {
                    organizationId: input.organizationId,
                    productId: variant.product_id,
                    variantId: variant.id,
                    type: 'ENTRY',
                    purpose: 'LOAN_RETURN',
                    quantity: item.quantity,
                    unitCost: loanItem.unit_cost_snapshot,
                    originId: input.id,
                    originItemId: loanItem.id,
                    reason: 'Devolucao de emprestimo',
                    notes: input.notes,
                    movementDate: input.returnedAt,
                    createdBy: input.createdBy,
                })
            }
            await this.refreshStatus(databaseClient, input)
            return (await this.selectLoan(databaseClient, input))!
        })
    }

    createOccurrence(input: {
        id: string
        organizationId: string
        type: LoanOccurrenceType
        occurredAt: Date
        description: string | null
        createdBy: string
        idempotencyKey: string | null
        items: Array<{ loanItemId: string; quantity: string }>
        charge: LoanChargeData | null
    }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            const existing = await this.findExistingEvent(databaseClient, {
                table: 'loan_occurrences',
                loanId: input.id,
                organizationId: input.organizationId,
                idempotencyKey: input.idempotencyKey,
            })
            if (existing) return (await this.selectLoan(databaseClient, input))!
            const loan = await this.ensureReleased(databaseClient, input)
            const [event] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO loan_occurrences (
                        organization_id, loan_id, type, occurred_at,
                        description, created_by, idempotency_key
                    )
                    VALUES (
                        :organizationId, :id, :type, :occurredAt,
                        :description, :createdBy, :idempotencyKey
                    )
                    RETURNING id
                `,
                input,
            )
            for (const item of input.items) {
                const loanItem = await this.lockItem(databaseClient, {
                    loanItemId: item.loanItemId,
                    loanId: input.id,
                    organizationId: input.organizationId,
                })
                this.assertPending(loanItem, item.quantity)
                await databaseClient.query(
                    `
                        INSERT INTO loan_occurrence_items (
                            organization_id, loan_occurrence_id, loan_item_id,
                            quantity
                        )
                        VALUES (
                            :organizationId, :eventId, :loanItemId, :quantity
                        )
                    `,
                    {
                        organizationId: input.organizationId,
                        eventId: event.id,
                        ...item,
                    },
                )
                await databaseClient.query(
                    `
                        UPDATE loan_items
                        SET ${input.type === 'LOSS' ? 'quantity_lost' : 'quantity_damaged'} =
                                ${input.type === 'LOSS' ? 'quantity_lost' : 'quantity_damaged'}
                                + CAST(:quantity AS NUMERIC),
                            updated_at = NOW()
                        WHERE id = :loanItemId
                    `,
                    item,
                )
            }
            if (input.charge) {
                await this.insertCharge(databaseClient, {
                    loan,
                    charge: { ...input.charge, occurrenceId: event.id },
                    createdBy: input.createdBy,
                })
            }
            await this.refreshStatus(databaseClient, input)
            return (await this.selectLoan(databaseClient, input))!
        })
    }

    createCharge(input: {
        id: string
        organizationId: string
        createdBy: string
        charge: LoanChargeData
    }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            const loan = await this.ensureLoan(databaseClient, input)
            if (loan.status === 'DRAFT' || loan.status === 'CANCELED')
                throw new ConflictError('Emprestimo nao permite cobranca')
            await this.insertCharge(databaseClient, {
                loan,
                charge: input.charge,
                createdBy: input.createdBy,
            })
            return (await this.selectLoan(databaseClient, input))!
        })
    }

    cancelCharge(input: {
        id: string
        chargeId: string
        organizationId: string
    }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            await this.ensureLoan(databaseClient, input)
            const [charge] = await databaseClient.select<{
                financial_transaction_id: string | null
                canceled_at: Date | null
                status: string | null
            }>(
                `
                    SELECT
                        charges.financial_transaction_id,
                        charges.canceled_at,
                        transactions.status
                    FROM loan_charges charges
                    LEFT JOIN financial_transactions transactions
                        ON transactions.id = charges.financial_transaction_id
                    WHERE charges.id = :chargeId
                        AND charges.loan_id = :id
                        AND charges.organization_id = :organizationId
                    FOR UPDATE OF charges
                `,
                input,
            )
            if (!charge) throw new NotFoundError('Cobranca nao encontrada')
            if (charge.canceled_at)
                throw new ConflictError('Cobranca ja cancelada')
            if (charge.status && charge.status !== 'PENDING')
                throw new ConflictError(
                    'Somente cobrancas pendentes podem ser canceladas',
                )
            await databaseClient.query(
                `
                    UPDATE loan_charges
                    SET canceled_at = NOW()
                    WHERE id = :chargeId
                        AND organization_id = :organizationId
                `,
                input,
            )
            if (charge.financial_transaction_id) {
                await databaseClient.query(
                    `
                        UPDATE financial_transactions
                        SET status = 'CANCELED',
                            canceled_at = NOW(),
                            updated_at = NOW()
                        WHERE id = :transactionId
                            AND organization_id = :organizationId
                            AND status = 'PENDING'
                            AND origin_type = 'LOAN_CHARGE'
                    `,
                    {
                        organizationId: input.organizationId,
                        transactionId: charge.financial_transaction_id,
                    },
                )
            }
            return (await this.selectLoan(databaseClient, input))!
        })
    }

    async customerIsActive(input: { id: string; organizationId: string }) {
        return this.exists(
            'customers',
            "status = 'ACTIVE' AND deleted_at IS NULL",
            input,
        )
    }

    async employeeIsActive(input: { id: string; organizationId: string }) {
        return this.exists(
            'hr_employees',
            "status <> 'TERMINATED' AND deleted_at IS NULL",
            input,
        )
    }

    async incomeCategoryIsActive(input: {
        id: string
        organizationId: string
    }) {
        return this.exists(
            'financial_categories',
            "status = 'ACTIVE' AND type = 'INCOME' AND deleted_at IS NULL",
            input,
        )
    }

    private async exists(
        table: string,
        extraCondition: string,
        input: { id: string; organizationId: string },
    ) {
        const rows = await this.databaseClient.select<{ id: string }>(
            `
                SELECT id
                FROM ${table}
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND ${extraCondition}
                LIMIT 1
            `,
            input,
        )
        return rows.length > 0
    }

    private async selectLoan(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ): Promise<LoanEntity | null> {
        const [loan] = await databaseClient.select<LoanRow>(
            `
                ${loanSelect}
                WHERE loans.id = :id
                    AND loans.organization_id = :organizationId
                    AND loans.deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )
        if (!loan) return null
        const [items, returns, occurrences, charges] = await Promise.all([
            this.selectItems(databaseClient, input),
            this.selectReturns(databaseClient, input),
            this.selectOccurrences(databaseClient, input),
            this.selectCharges(databaseClient, input),
        ])
        return {
            id: loan.id,
            organizationId: loan.organization_id,
            borrowerType: loan.borrower_type,
            customerId: loan.customer_id,
            customerName: loan.customer_name,
            employeeId: loan.employee_id,
            employeeName: loan.employee_name,
            status: loan.status,
            expectedReturnDate: String(loan.expected_return_date),
            isOverdue: loan.is_overdue,
            releasedAt: loan.released_at,
            completedAt: loan.completed_at,
            canceledAt: loan.canceled_at,
            notes: loan.notes,
            createdBy: loan.created_by,
            creatorName: loan.creator_name,
            createdAt: new Date(loan.created_at),
            updatedAt: new Date(loan.updated_at),
            deletedAt: loan.deleted_at ? new Date(loan.deleted_at) : null,
            items,
            returns,
            occurrences,
            charges,
        }
    }

    private async selectItems(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ): Promise<LoanItemEntity[]> {
        const rows = await databaseClient.select<LoanItemRow>(
            `
                SELECT
                    items.*,
                    products.name AS product_name,
                    variants.name AS variant_name,
                    variants.sku AS variant_sku,
                    (
                        items.quantity_released
                        - items.quantity_returned
                        - items.quantity_lost
                        - items.quantity_damaged
                    )::NUMERIC(15, 3)::TEXT AS pending_quantity
                FROM loan_items items
                INNER JOIN inventory_variants variants
                    ON variants.id = items.variant_id
                INNER JOIN inventory_products products
                    ON products.id = variants.product_id
                WHERE items.loan_id = :id
                    AND items.organization_id = :organizationId
                ORDER BY products.name, variants.name
            `,
            input,
        )
        return rows.map((row) => ({
            id: row.id,
            organizationId: row.organization_id,
            loanId: row.loan_id,
            variantId: row.variant_id,
            productName: row.product_name,
            variantName: row.variant_name,
            variantSku: row.variant_sku,
            quantityReleased: row.quantity_released,
            quantityReturned: row.quantity_returned,
            quantityLost: row.quantity_lost,
            quantityDamaged: row.quantity_damaged,
            pendingQuantity: row.pending_quantity,
            unitCostSnapshot: row.unit_cost_snapshot,
            notes: row.notes,
        }))
    }

    private async selectReturns(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ): Promise<LoanReturnEntity[]> {
        const events = await databaseClient.select<ReturnRow>(
            `
                SELECT *
                FROM loan_returns
                WHERE loan_id = :id
                    AND organization_id = :organizationId
                ORDER BY returned_at DESC, created_at DESC
            `,
            input,
        )
        return Promise.all(
            events.map(async (event) => ({
                id: event.id,
                organizationId: event.organization_id,
                loanId: event.loan_id,
                returnedAt: new Date(event.returned_at),
                notes: event.notes,
                createdBy: event.created_by,
                createdAt: new Date(event.created_at),
                items: await this.selectEventItems(databaseClient, {
                    table: 'loan_return_items',
                    key: 'loan_return_id',
                    eventId: event.id,
                }),
            })),
        )
    }

    private async selectOccurrences(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ): Promise<LoanOccurrenceEntity[]> {
        const events = await databaseClient.select<OccurrenceRow>(
            `
                SELECT *
                FROM loan_occurrences
                WHERE loan_id = :id
                    AND organization_id = :organizationId
                ORDER BY occurred_at DESC, created_at DESC
            `,
            input,
        )
        return Promise.all(
            events.map(async (event) => ({
                id: event.id,
                organizationId: event.organization_id,
                loanId: event.loan_id,
                type: event.type,
                occurredAt: new Date(event.occurred_at),
                description: event.description,
                createdBy: event.created_by,
                createdAt: new Date(event.created_at),
                items: await this.selectEventItems(databaseClient, {
                    table: 'loan_occurrence_items',
                    key: 'loan_occurrence_id',
                    eventId: event.id,
                }),
            })),
        )
    }

    private async selectEventItems(
        databaseClient: DatabaseClient,
        input: { table: string; key: string; eventId: string },
    ): Promise<LoanEventItemEntity[]> {
        const rows = await databaseClient.select<EventItemRow>(
            `
                SELECT id, loan_item_id, quantity::TEXT
                FROM ${input.table}
                WHERE ${input.key} = :eventId
                ORDER BY id
            `,
            input,
        )
        return rows.map((row) => ({
            id: row.id,
            loanItemId: row.loan_item_id,
            quantity: row.quantity,
        }))
    }

    private async selectCharges(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ): Promise<LoanChargeEntity[]> {
        const rows = await databaseClient.select<ChargeRow>(
            `
                SELECT *
                FROM loan_charges
                WHERE loan_id = :id
                    AND organization_id = :organizationId
                ORDER BY created_at DESC
            `,
            input,
        )
        return rows.map((row) => ({
            id: row.id,
            organizationId: row.organization_id,
            loanId: row.loan_id,
            occurrenceId: row.occurrence_id,
            financialTransactionId: row.financial_transaction_id,
            type: row.type,
            categoryId: row.category_id,
            amount: row.amount,
            dueDate: String(row.due_date),
            description: row.description,
            canceledAt: row.canceled_at ? new Date(row.canceled_at) : null,
            createdAt: new Date(row.created_at),
        }))
    }

    private filters(filters: LoanFilters) {
        const clauses = [
            'loans.organization_id = :organizationId',
            'loans.deleted_at IS NULL',
        ]
        const replacements: Record<string, unknown> = {
            organizationId: filters.organizationId,
        }
        if (filters.status) {
            clauses.push('loans.status = :status')
            replacements.status = filters.status
        }
        if (filters.borrowerType) {
            clauses.push('loans.borrower_type = :borrowerType')
            replacements.borrowerType = filters.borrowerType
        }
        if (filters.borrowerId) {
            clauses.push(`(
                loans.customer_id = :borrowerId
                OR loans.employee_id = :borrowerId
            )`)
            replacements.borrowerId = filters.borrowerId
        }
        if (filters.search) {
            clauses.push(`(
                customers.name ILIKE :search
                OR employees.name ILIKE :search
                OR loans.notes ILIKE :search
            )`)
            replacements.search = `%${filters.search}%`
        }
        if (filters.startDate) {
            clauses.push('loans.expected_return_date >= :startDate')
            replacements.startDate = filters.startDate
        }
        if (filters.endDate) {
            clauses.push('loans.expected_return_date <= :endDate')
            replacements.endDate = filters.endDate
        }
        if (filters.overdue !== undefined) {
            const overdueExpression = `(
                loans.status IN ('RELEASED', 'PARTIALLY_RETURNED')
                AND loans.expected_return_date < CURRENT_DATE
                AND EXISTS (
                    SELECT 1
                    FROM loan_items pending_items
                    WHERE pending_items.loan_id = loans.id
                        AND (
                            pending_items.quantity_released
                            - pending_items.quantity_returned
                            - pending_items.quantity_lost
                            - pending_items.quantity_damaged
                        ) > 0
                )
            )`
            clauses.push(
                filters.overdue
                    ? overdueExpression
                    : `NOT ${overdueExpression}`,
            )
        }
        return {
            where: `WHERE ${clauses.join('\n AND ')}`,
            replacements,
        }
    }

    private async lockLoan(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        const [loan] = await databaseClient.select<LoanRow>(
            `
                ${loanSelect}
                WHERE loans.id = :id
                    AND loans.organization_id = :organizationId
                    AND loans.deleted_at IS NULL
                FOR UPDATE OF loans
            `,
            input,
        )
        if (!loan) throw new NotFoundError('Emprestimo nao encontrado')
        return loan
    }

    private async ensureLoan(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        return this.lockLoan(databaseClient, input)
    }

    private async ensureReleased(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        const loan = await this.lockLoan(databaseClient, input)
        if (!['RELEASED', 'PARTIALLY_RETURNED'].includes(loan.status)) {
            throw new ConflictError('Emprestimo nao esta liberado')
        }
        return loan
    }

    private async lockItems(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        const rows = await databaseClient.select<LoanItemRow>(
            `
                SELECT
                    items.*,
                    products.name AS product_name,
                    variants.name AS variant_name,
                    variants.sku AS variant_sku,
                    (
                        items.quantity_released
                        - items.quantity_returned
                        - items.quantity_lost
                        - items.quantity_damaged
                    )::NUMERIC(15, 3)::TEXT AS pending_quantity
                FROM loan_items items
                INNER JOIN inventory_variants variants
                    ON variants.id = items.variant_id
                INNER JOIN inventory_products products
                    ON products.id = variants.product_id
                WHERE items.loan_id = :id
                    AND items.organization_id = :organizationId
                FOR UPDATE OF items
            `,
            input,
        )
        if (!rows.length) throw new ConflictError('Emprestimo sem itens')
        return rows
    }

    private async lockItem(
        databaseClient: DatabaseClient,
        input: {
            loanItemId: string
            loanId: string
            organizationId: string
        },
    ) {
        const rows = await this.lockItems(databaseClient, {
            id: input.loanId,
            organizationId: input.organizationId,
        })
        const item = rows.find((row) => row.id === input.loanItemId)
        if (!item) throw new NotFoundError('Item do emprestimo nao encontrado')
        return item
    }

    private async lockVariant(
        databaseClient: DatabaseClient,
        input: { organizationId: string; variantId: string },
    ) {
        const [variant] = await databaseClient.select<VariantRow>(
            `
                SELECT variants.*
                FROM inventory_variants variants
                INNER JOIN inventory_products products
                    ON products.id = variants.product_id
                WHERE variants.id = :variantId
                    AND variants.organization_id = :organizationId
                    AND variants.status = 'ACTIVE'
                    AND products.status = 'ACTIVE'
                    AND variants.deleted_at IS NULL
                    AND products.deleted_at IS NULL
                FOR UPDATE OF variants
            `,
            input,
        )
        if (!variant) throw new NotFoundError('Variante ativa nao encontrada')
        return variant
    }

    private assertPending(item: LoanItemRow, quantity: string) {
        if (Number(quantity) > Number(item.pending_quantity)) {
            throw new ConflictError(
                'Quantidade maior que o pendente do emprestimo',
            )
        }
    }

    private async moveInventory(
        databaseClient: DatabaseClient,
        input: {
            organizationId: string
            productId: string
            variantId: string
            type: 'ENTRY' | 'EXIT'
            purpose: 'LOAN_RELEASE' | 'LOAN_RETURN'
            quantity: string
            unitCost: string
            originId: string
            originItemId: string
            reason: string
            notes: string | null
            movementDate: Date
            createdBy: string
        },
    ) {
        await databaseClient.query(
            `
                UPDATE inventory_variants
                SET current_quantity =
                        current_quantity + CAST(:quantity AS NUMERIC),
                    updated_at = NOW()
                WHERE id = :variantId
                    AND organization_id = :organizationId
            `,
            input,
        )
        await databaseClient.query(
            `
                INSERT INTO inventory_movements (
                    organization_id, product_id, variant_id, type, direction,
                    purpose, quantity, unit_cost, total_cost, supplier_id,
                    origin_type, origin_id, origin_item_id, reason, notes,
                    movement_date, created_by
                )
                VALUES (
                    :organizationId, :productId, :variantId, :type,
                    CASE
                        WHEN CAST(:quantity AS NUMERIC) > 0 THEN 'IN'
                        ELSE 'OUT'
                    END,
                    :purpose, :quantity, :unitCost,
                    ABS(CAST(:quantity AS NUMERIC) * CAST(:unitCost AS NUMERIC)),
                    NULL, 'LOAN', :originId, :originItemId, :reason, :notes,
                    :movementDate, :createdBy
                )
            `,
            input,
        )
    }

    private async refreshStatus(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        await databaseClient.query(
            `
                WITH totals AS (
                    SELECT
                        SUM(quantity_released)::NUMERIC AS released,
                        SUM(
                            quantity_returned
                            + quantity_lost
                            + quantity_damaged
                        )::NUMERIC AS resolved
                    FROM loan_items
                    WHERE loan_id = :id
                        AND organization_id = :organizationId
                )
                UPDATE loans
                SET status = CASE
                        WHEN totals.resolved = 0 THEN 'RELEASED'
                        WHEN totals.resolved >= totals.released THEN 'COMPLETED'
                        ELSE 'PARTIALLY_RETURNED'
                    END,
                    completed_at = CASE
                        WHEN totals.resolved >= totals.released
                            THEN COALESCE(completed_at, NOW())
                        ELSE NULL
                    END,
                    updated_at = NOW()
                FROM totals
                WHERE loans.id = :id
                    AND loans.organization_id = :organizationId
            `,
            input,
        )
    }

    private async insertCharge(
        databaseClient: DatabaseClient,
        input: {
            loan: LoanRow
            charge: LoanChargeData
            createdBy: string
        },
    ) {
        const [transaction] = await databaseClient.query<{ id: string }>(
            `
                INSERT INTO financial_transactions (
                    organization_id, account_id, category_id, customer_id,
                    supplier_id, employee_id, origin_type, origin_id,
                    description, notes, type, amount, transaction_date,
                    due_date, created_by
                )
                VALUES (
                    :organizationId, NULL, :categoryId, :customerId,
                    NULL, :employeeId, 'LOAN_CHARGE', NULL,
                    :description, NULL, 'INCOME', :amount, CURRENT_DATE,
                    :dueDate, :createdBy
                )
                RETURNING id
            `,
            {
                organizationId: input.loan.organization_id,
                categoryId: input.charge.categoryId,
                customerId: input.loan.customer_id,
                employeeId: input.loan.employee_id,
                description: input.charge.description,
                amount: input.charge.amount,
                dueDate: input.charge.dueDate,
                createdBy: input.createdBy,
            },
        )
        const [charge] = await databaseClient.query<{ id: string }>(
            `
                INSERT INTO loan_charges (
                    organization_id, loan_id, occurrence_id,
                    financial_transaction_id, type, category_id, amount,
                    due_date, description, idempotency_key, created_by
                )
                VALUES (
                    :organizationId, :loanId, :occurrenceId,
                    :financialTransactionId, :type, :categoryId, :amount,
                    :dueDate, :description, :idempotencyKey, :createdBy
                )
                RETURNING id
            `,
            {
                organizationId: input.loan.organization_id,
                loanId: input.loan.id,
                occurrenceId: input.charge.occurrenceId,
                financialTransactionId: transaction.id,
                type: input.charge.type,
                categoryId: input.charge.categoryId,
                amount: input.charge.amount,
                dueDate: input.charge.dueDate,
                description: input.charge.description,
                idempotencyKey: input.charge.idempotencyKey,
                createdBy: input.createdBy,
            },
        )
        await databaseClient.query(
            `
                UPDATE financial_transactions
                SET origin_id = :chargeId
                WHERE id = :transactionId
            `,
            { chargeId: charge.id, transactionId: transaction.id },
        )
    }

    private async findExistingEvent(
        databaseClient: DatabaseClient,
        input: {
            table: 'loan_returns' | 'loan_occurrences'
            loanId: string
            organizationId: string
            idempotencyKey: string | null
        },
    ) {
        if (!input.idempotencyKey) return false
        const rows = await databaseClient.select<{ id: string }>(
            `
                SELECT id
                FROM ${input.table}
                WHERE loan_id = :loanId
                    AND organization_id = :organizationId
                    AND idempotency_key = :idempotencyKey
                LIMIT 1
            `,
            input,
        )
        return rows.length > 0
    }
}
