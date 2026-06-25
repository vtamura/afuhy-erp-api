import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import {
    centsToMoney,
    moneyToCents,
} from '../../../financial/domain/money/money'
import type {
    ReportFinancialItemEntity,
    ReportsFinancialEntity,
    ReportsHrEntity,
    ReportsInventoryEntity,
    ReportsLoansEntity,
    ReportsTasksEntity,
} from '../../domain/entities/report.entity'
import type {
    ReportsDashboardQuery,
    ReportsRepository,
} from '../../domain/repositories/report.repository'

type FinancialTotalsRow = {
    paid_income: string
    paid_expense: string
    pending_income: string
    pending_expense: string
}

type BalanceRow = {
    current_balance: string
    projected_balance: string
}

type MonthlyFlowRow = {
    year: string
    month: string
    income: string
    expense: string
    result: string
}

type FinancialItemRow = {
    id: string
    description: string
    type: 'INCOME' | 'EXPENSE'
    amount: string
    due_date: string | null
    status: 'PENDING' | 'PAID' | 'CANCELED'
}

type InventoryTotalsRow = {
    active_products: string
    active_skus: string
    total_quantity: string
    total_value: string
    zero_stock_count: string
    low_stock_count: string
}

type LowStockRow = {
    product_id: string
    product_name: string
    variant_id: string
    variant_name: string
    sku: string
    current_quantity: string
    minimum_quantity: string
}

type HrStatusRow = {
    status: string
    total: string
}

type HrTotalsRow = {
    total_employees: string
    admissions: string
    terminations: string
}

type LoanTotalsRow = {
    open_loans: string
    overdue_loans: string
    completed_loans: string
    pending_items_quantity: string
    lost_occurrences: string
    damaged_occurrences: string
    pending_charges_count: string
    pending_charges_amount: string
}

type LoanOverdueRow = {
    id: string
    borrower_type: 'CUSTOMER' | 'EMPLOYEE'
    borrower_name: string | null
    expected_return_date: string
    pending_quantity: string
}

type TaskTotalsRow = {
    open_tasks: string
    overdue_tasks: string
    urgent_tasks: string
    completed_tasks: string
}

type TaskPriorityRow = {
    priority: string
    total: string
}

type TaskAttentionRow = {
    id: string
    title: string
    status: string
    priority: string
    due_at: Date | null
}

export class PostgresReportsRepository implements ReportsRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async getFinancial(
        query: ReportsDashboardQuery,
    ): Promise<ReportsFinancialEntity> {
        const [balances, cashFlow, monthlyFlow, overdueTotals, overdueItems] =
            await Promise.all([
                this.financialBalances(query),
                this.financialCashFlow(query),
                this.financialMonthlyFlow(query),
                this.financialOverdueTotals(query),
                this.financialOverdueItems(query),
            ])
        const monthlyByKey = new Map(
            monthlyFlow.map((item) => [`${item.year}-${item.month}`, item]),
        )
        const series = buildMonthSeriesFromRange(
            query.seriesStart,
            query.periodEnd,
        )

        return {
            balances,
            cashFlow: {
                ...cashFlow,
                result: centsToMoney(
                    moneyToCents(cashFlow.paidIncome) -
                        moneyToCents(cashFlow.paidExpense),
                ),
            },
            monthlyFlow: series.map(({ year, month }) => {
                const found = monthlyByKey.get(`${year}-${month}`)
                return (
                    found ?? {
                        year,
                        month,
                        income: '0.00',
                        expense: '0.00',
                        result: '0.00',
                    }
                )
            }),
            overdue: {
                ...overdueTotals,
                items: overdueItems,
            },
        }
    }

    async getInventory(
        query: ReportsDashboardQuery,
    ): Promise<ReportsInventoryEntity> {
        const [totals] = await this.databaseClient.select<InventoryTotalsRow>(
            `
                SELECT
                    COUNT(DISTINCT products.id) FILTER (
                        WHERE products.status = 'ACTIVE'
                    )::TEXT AS active_products,
                    COUNT(variants.id) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                    )::TEXT AS active_skus,
                    COALESCE(SUM(variants.current_quantity) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                    ), 0)::NUMERIC(18, 3)::TEXT AS total_quantity,
                    COALESCE(SUM(
                        variants.current_quantity * variants.average_cost
                    ) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                    ), 0)::NUMERIC(18, 2)::TEXT AS total_value,
                    COUNT(variants.id) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                            AND variants.current_quantity = 0
                    )::TEXT AS zero_stock_count,
                    COUNT(variants.id) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                            AND variants.current_quantity <
                                variants.minimum_quantity
                    )::TEXT AS low_stock_count
                FROM inventory_products products
                LEFT JOIN inventory_variants variants
                    ON variants.product_id = products.id
                    AND variants.deleted_at IS NULL
                WHERE products.organization_id = :organizationId
                    AND products.deleted_at IS NULL
            `,
            query,
        )
        const lowStockItems = await this.lowStockItems(query, 5)

        return {
            activeProducts: Number(totals.active_products),
            activeSkus: Number(totals.active_skus),
            totalQuantity: totals.total_quantity,
            totalValue: totals.total_value,
            zeroStockCount: Number(totals.zero_stock_count),
            lowStockCount: Number(totals.low_stock_count),
            lowStockItems,
        }
    }

    async getHr(query: ReportsDashboardQuery): Promise<ReportsHrEntity> {
        const [totals] = await this.databaseClient.select<HrTotalsRow>(
            `
                SELECT
                    COUNT(*) FILTER (
                        WHERE deleted_at IS NULL
                    )::TEXT AS total_employees,
                    COUNT(*) FILTER (
                        WHERE hire_date BETWEEN :periodStart AND :periodEnd
                            AND deleted_at IS NULL
                    )::TEXT AS admissions,
                    COUNT(*) FILTER (
                        WHERE termination_date
                            BETWEEN :periodStart AND :periodEnd
                            AND deleted_at IS NULL
                    )::TEXT AS terminations
                FROM hr_employees
                WHERE organization_id = :organizationId
            `,
            query,
        )
        const statuses = await this.databaseClient.select<HrStatusRow>(
            `
                SELECT status, COUNT(*)::TEXT AS total
                FROM hr_employees
                WHERE organization_id = :organizationId
                    AND deleted_at IS NULL
                GROUP BY status
                ORDER BY status
            `,
            query,
        )

        return {
            totalEmployees: Number(totals.total_employees),
            byStatus: statuses.map((row) => ({
                status: row.status,
                total: Number(row.total),
            })),
            admissions: Number(totals.admissions),
            terminations: Number(totals.terminations),
        }
    }

    async getLoans(query: ReportsDashboardQuery): Promise<ReportsLoansEntity> {
        const [totals] = await this.databaseClient.select<LoanTotalsRow>(
            `
                WITH loan_pending AS (
                    SELECT
                        loans.id,
                        loans.status,
                        loans.expected_return_date,
                        loans.completed_at,
                        COALESCE(SUM(
                            items.quantity_released
                            - items.quantity_returned
                            - items.quantity_lost
                            - items.quantity_damaged
                        ), 0) AS pending_quantity
                    FROM loans
                    LEFT JOIN loan_items items
                        ON items.loan_id = loans.id
                    WHERE loans.organization_id = :organizationId
                        AND loans.deleted_at IS NULL
                    GROUP BY loans.id
                )
                SELECT
                    COUNT(*) FILTER (
                        WHERE status IN ('RELEASED', 'PARTIALLY_RETURNED')
                    )::TEXT AS open_loans,
                    COUNT(*) FILTER (
                        WHERE status IN ('RELEASED', 'PARTIALLY_RETURNED')
                            AND expected_return_date < :today
                            AND pending_quantity > 0
                    )::TEXT AS overdue_loans,
                    COUNT(*) FILTER (
                        WHERE status = 'COMPLETED'
                            AND completed_at::DATE
                                BETWEEN :periodStart AND :periodEnd
                    )::TEXT AS completed_loans,
                    COALESCE(SUM(pending_quantity) FILTER (
                        WHERE status IN ('RELEASED', 'PARTIALLY_RETURNED')
                    ), 0)::NUMERIC(18, 3)::TEXT AS pending_items_quantity,
                    (
                        SELECT COUNT(*)::TEXT
                        FROM loan_occurrences
                        WHERE organization_id = :organizationId
                            AND type = 'LOSS'
                            AND occurred_at::DATE
                                BETWEEN :periodStart AND :periodEnd
                    ) AS lost_occurrences,
                    (
                        SELECT COUNT(*)::TEXT
                        FROM loan_occurrences
                        WHERE organization_id = :organizationId
                            AND type = 'DAMAGE'
                            AND occurred_at::DATE
                                BETWEEN :periodStart AND :periodEnd
                    ) AS damaged_occurrences,
                    (
                        SELECT COUNT(*)::TEXT
                        FROM loan_charges charges
                        INNER JOIN financial_transactions transactions
                            ON transactions.id = charges.financial_transaction_id
                        WHERE charges.organization_id = :organizationId
                            AND charges.canceled_at IS NULL
                            AND transactions.status = 'PENDING'
                            AND transactions.deleted_at IS NULL
                    ) AS pending_charges_count,
                    (
                        SELECT COALESCE(SUM(charges.amount), 0)::NUMERIC(15, 2)::TEXT
                        FROM loan_charges charges
                        INNER JOIN financial_transactions transactions
                            ON transactions.id = charges.financial_transaction_id
                        WHERE charges.organization_id = :organizationId
                            AND charges.canceled_at IS NULL
                            AND transactions.status = 'PENDING'
                            AND transactions.deleted_at IS NULL
                    ) AS pending_charges_amount
                FROM loan_pending
            `,
            query,
        )
        const overdueItems = await this.loanOverdueItems(query)

        return {
            openLoans: Number(totals.open_loans),
            overdueLoans: Number(totals.overdue_loans),
            completedLoans: Number(totals.completed_loans),
            pendingItemsQuantity: totals.pending_items_quantity,
            occurrences: {
                lost: Number(totals.lost_occurrences),
                damaged: Number(totals.damaged_occurrences),
            },
            pendingCharges: {
                count: Number(totals.pending_charges_count),
                amount: totals.pending_charges_amount,
            },
            overdueItems,
        }
    }

    async getTasks(query: ReportsDashboardQuery): Promise<ReportsTasksEntity> {
        const [totals] = await this.databaseClient.select<TaskTotalsRow>(
            `
                SELECT
                    COUNT(*) FILTER (
                        WHERE status <> 'DONE'
                    )::TEXT AS open_tasks,
                    COUNT(*) FILTER (
                        WHERE status <> 'DONE'
                            AND due_at IS NOT NULL
                            AND due_at::DATE < :today
                    )::TEXT AS overdue_tasks,
                    COUNT(*) FILTER (
                        WHERE status <> 'DONE'
                            AND priority = 'URGENT'
                    )::TEXT AS urgent_tasks,
                    COUNT(*) FILTER (
                        WHERE status = 'DONE'
                            AND completed_at::DATE
                                BETWEEN :periodStart AND :periodEnd
                    )::TEXT AS completed_tasks
                FROM tasks
                WHERE organization_id = :organizationId
                    AND deleted_at IS NULL
            `,
            query,
        )
        const [priorityBreakdown, attentionItems] = await Promise.all([
            this.databaseClient.select<TaskPriorityRow>(
                `
                    SELECT priority, COUNT(*)::TEXT AS total
                    FROM tasks
                    WHERE organization_id = :organizationId
                        AND status <> 'DONE'
                        AND deleted_at IS NULL
                    GROUP BY priority
                    ORDER BY priority
                `,
                query,
            ),
            this.taskAttentionItems(query),
        ])

        return {
            openTasks: Number(totals.open_tasks),
            overdueTasks: Number(totals.overdue_tasks),
            urgentTasks: Number(totals.urgent_tasks),
            completedTasks: Number(totals.completed_tasks),
            priorityBreakdown: priorityBreakdown.map((row) => ({
                priority: row.priority,
                total: Number(row.total),
            })),
            attentionItems,
        }
    }

    private async financialBalances(query: ReportsDashboardQuery) {
        const [row] = await this.databaseClient.select<BalanceRow>(
            `
                SELECT
                    COALESCE(SUM(current_balance), 0)::NUMERIC(15, 2)::TEXT
                        AS current_balance,
                    COALESCE(SUM(projected_balance), 0)::NUMERIC(15, 2)::TEXT
                        AS projected_balance
                FROM (
                    SELECT
                        accounts.id,
                        (
                            accounts.initial_balance +
                            COALESCE(SUM(
                                CASE
                                    WHEN transactions.status = 'PAID'
                                        AND transactions.type = 'INCOME'
                                        THEN transactions.amount
                                    WHEN transactions.status = 'PAID'
                                        AND transactions.type = 'EXPENSE'
                                        THEN -transactions.amount
                                    ELSE 0
                                END
                            ), 0)
                        ) AS current_balance,
                        (
                            accounts.initial_balance +
                            COALESCE(SUM(
                                CASE
                                    WHEN transactions.status IN ('PAID', 'PENDING')
                                        AND transactions.type = 'INCOME'
                                        THEN transactions.amount
                                    WHEN transactions.status IN ('PAID', 'PENDING')
                                        AND transactions.type = 'EXPENSE'
                                        THEN -transactions.amount
                                    ELSE 0
                                END
                            ), 0)
                        ) AS projected_balance
                    FROM financial_accounts accounts
                    LEFT JOIN financial_transactions transactions
                        ON transactions.account_id = accounts.id
                        AND transactions.deleted_at IS NULL
                    WHERE accounts.organization_id = :organizationId
                        AND accounts.deleted_at IS NULL
                    GROUP BY accounts.id
                ) balances
            `,
            query,
        )
        return {
            current: row.current_balance,
            projected: row.projected_balance,
        }
    }

    private async financialCashFlow(query: ReportsDashboardQuery) {
        const [row] = await this.databaseClient.select<FinancialTotalsRow>(
            `
                SELECT
                    COALESCE(SUM(amount) FILTER (
                        WHERE status = 'PAID' AND type = 'INCOME'
                    ), 0)::NUMERIC(15, 2)::TEXT AS paid_income,
                    COALESCE(SUM(amount) FILTER (
                        WHERE status = 'PAID' AND type = 'EXPENSE'
                    ), 0)::NUMERIC(15, 2)::TEXT AS paid_expense,
                    COALESCE(SUM(amount) FILTER (
                        WHERE status = 'PENDING' AND type = 'INCOME'
                    ), 0)::NUMERIC(15, 2)::TEXT AS pending_income,
                    COALESCE(SUM(amount) FILTER (
                        WHERE status = 'PENDING' AND type = 'EXPENSE'
                    ), 0)::NUMERIC(15, 2)::TEXT AS pending_expense
                FROM financial_transactions
                WHERE organization_id = :organizationId
                    AND transaction_date BETWEEN :periodStart AND :periodEnd
                    AND deleted_at IS NULL
            `,
            query,
        )
        return {
            paidIncome: row.paid_income,
            paidExpense: row.paid_expense,
            pendingIncome: row.pending_income,
            pendingExpense: row.pending_expense,
        }
    }

    private async financialMonthlyFlow(query: ReportsDashboardQuery) {
        const rows = await this.databaseClient.select<MonthlyFlowRow>(
            `
                SELECT
                    EXTRACT(YEAR FROM transaction_date)::INTEGER::TEXT AS year,
                    EXTRACT(MONTH FROM transaction_date)::INTEGER::TEXT AS month,
                    COALESCE(SUM(amount) FILTER (
                        WHERE type = 'INCOME'
                    ), 0)::NUMERIC(15, 2)::TEXT AS income,
                    COALESCE(SUM(amount) FILTER (
                        WHERE type = 'EXPENSE'
                    ), 0)::NUMERIC(15, 2)::TEXT AS expense,
                    COALESCE(SUM(
                        CASE
                            WHEN type = 'INCOME' THEN amount
                            ELSE -amount
                        END
                    ), 0)::NUMERIC(15, 2)::TEXT AS result
                FROM financial_transactions
                WHERE organization_id = :organizationId
                    AND status = 'PAID'
                    AND transaction_date BETWEEN :seriesStart AND :periodEnd
                    AND deleted_at IS NULL
                GROUP BY
                    EXTRACT(YEAR FROM transaction_date),
                    EXTRACT(MONTH FROM transaction_date)
                ORDER BY year, month
            `,
            query,
        )
        return rows.map((row) => ({
            year: Number(row.year),
            month: Number(row.month),
            income: row.income,
            expense: row.expense,
            result: row.result,
        }))
    }

    private async financialOverdueTotals(query: ReportsDashboardQuery) {
        const [row] = await this.databaseClient.select<{
            count: string
            income: string
            expense: string
        }>(
            `
                SELECT
                    COUNT(*)::TEXT AS count,
                    COALESCE(SUM(amount) FILTER (
                        WHERE type = 'INCOME'
                    ), 0)::NUMERIC(15, 2)::TEXT AS income,
                    COALESCE(SUM(amount) FILTER (
                        WHERE type = 'EXPENSE'
                    ), 0)::NUMERIC(15, 2)::TEXT AS expense
                FROM financial_transactions
                WHERE organization_id = :organizationId
                    AND status = 'PENDING'
                    AND due_date < :today
                    AND deleted_at IS NULL
            `,
            query,
        )
        return {
            count: Number(row.count),
            income: row.income,
            expense: row.expense,
        }
    }

    private async financialOverdueItems(
        query: ReportsDashboardQuery,
    ): Promise<ReportFinancialItemEntity[]> {
        const rows = await this.databaseClient.select<FinancialItemRow>(
            `
                SELECT id, description, type, amount::TEXT, due_date::TEXT, status
                FROM financial_transactions
                WHERE organization_id = :organizationId
                    AND status = 'PENDING'
                    AND due_date < :today
                    AND deleted_at IS NULL
                ORDER BY due_date ASC, created_at ASC
                LIMIT 5
            `,
            query,
        )
        return rows.map((row) => ({
            id: row.id,
            description: row.description,
            type: row.type,
            amount: row.amount,
            dueDate: row.due_date,
            status: row.status,
        }))
    }

    private async lowStockItems(query: ReportsDashboardQuery, limit: number) {
        const rows = await this.databaseClient.select<LowStockRow>(
            `
                SELECT
                    products.id AS product_id,
                    products.name AS product_name,
                    variants.id AS variant_id,
                    variants.name AS variant_name,
                    variants.sku,
                    variants.current_quantity::TEXT,
                    variants.minimum_quantity::TEXT
                FROM inventory_variants variants
                INNER JOIN inventory_products products
                    ON products.id = variants.product_id
                WHERE variants.organization_id = :organizationId
                    AND products.status = 'ACTIVE'
                    AND variants.status = 'ACTIVE'
                    AND products.deleted_at IS NULL
                    AND variants.deleted_at IS NULL
                    AND variants.current_quantity < variants.minimum_quantity
                ORDER BY
                    (variants.minimum_quantity - variants.current_quantity)
                        DESC,
                    products.name,
                    variants.name
                LIMIT :limit
            `,
            { ...query, limit },
        )
        return rows.map((row) => ({
            productId: row.product_id,
            productName: row.product_name,
            variantId: row.variant_id,
            variantName: row.variant_name,
            sku: row.sku,
            currentQuantity: row.current_quantity,
            minimumQuantity: row.minimum_quantity,
        }))
    }

    private async loanOverdueItems(query: ReportsDashboardQuery) {
        const rows = await this.databaseClient.select<LoanOverdueRow>(
            `
                SELECT
                    loans.id,
                    loans.borrower_type,
                    COALESCE(customers.name, employees.name) AS borrower_name,
                    loans.expected_return_date::TEXT,
                    COALESCE(SUM(
                        items.quantity_released
                        - items.quantity_returned
                        - items.quantity_lost
                        - items.quantity_damaged
                    ), 0)::NUMERIC(18, 3)::TEXT AS pending_quantity
                FROM loans
                INNER JOIN loan_items items
                    ON items.loan_id = loans.id
                LEFT JOIN customers
                    ON customers.id = loans.customer_id
                LEFT JOIN hr_employees employees
                    ON employees.id = loans.employee_id
                WHERE loans.organization_id = :organizationId
                    AND loans.status IN ('RELEASED', 'PARTIALLY_RETURNED')
                    AND loans.expected_return_date < :today
                    AND loans.deleted_at IS NULL
                GROUP BY loans.id, customers.name, employees.name
                HAVING COALESCE(SUM(
                    items.quantity_released
                    - items.quantity_returned
                    - items.quantity_lost
                    - items.quantity_damaged
                ), 0) > 0
                ORDER BY loans.expected_return_date ASC, loans.created_at ASC
                LIMIT 5
            `,
            query,
        )
        return rows.map((row) => ({
            id: row.id,
            borrowerType: row.borrower_type,
            borrowerName: row.borrower_name,
            expectedReturnDate: row.expected_return_date,
            pendingQuantity: row.pending_quantity,
        }))
    }

    private async taskAttentionItems(query: ReportsDashboardQuery) {
        const rows = await this.databaseClient.select<TaskAttentionRow>(
            `
                SELECT id, title, status, priority, due_at
                FROM tasks
                WHERE organization_id = :organizationId
                    AND status <> 'DONE'
                    AND deleted_at IS NULL
                    AND (
                        priority = 'URGENT'
                        OR (
                            due_at IS NOT NULL
                            AND due_at::DATE < :today
                        )
                    )
                ORDER BY
                    CASE WHEN due_at IS NOT NULL AND due_at::DATE < :today
                        THEN 0 ELSE 1 END,
                    CASE priority
                        WHEN 'URGENT' THEN 0
                        WHEN 'HIGH' THEN 1
                        WHEN 'MEDIUM' THEN 2
                        ELSE 3
                    END,
                    due_at ASC NULLS LAST,
                    created_at ASC
                LIMIT 5
            `,
            query,
        )
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            priority: row.priority,
            dueAt: row.due_at?.toISOString() ?? null,
        }))
    }
}

function buildMonthSeriesFromRange(start: string, end: string) {
    const series: Array<{ year: number; month: number }> = []
    const cursor = new Date(`${start}T00:00:00.000Z`)
    const endDate = new Date(`${end}T00:00:00.000Z`)
    while (cursor <= endDate) {
        series.push({
            year: cursor.getUTCFullYear(),
            month: cursor.getUTCMonth() + 1,
        })
        cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }
    return series
}
