import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    FinancialAccountEntity,
    FinancialAccountType,
    FinancialCategoryEntity,
    FinancialResourceStatus,
    FinancialTransactionEntity,
    FinancialTransactionStatus,
    FinancialTransactionType,
} from '../../domain/entities/financial.entity'
import type {
    FinancialDashboardCategory,
    FinancialDashboardData,
    FinancialDashboardDueGroup,
    FinancialDashboardQuery,
    FinancialDashboardRepository,
} from '../../domain/repositories/financial-dashboard.repository'
import type {
    FinancialObligationEntity,
    FinancialObligationFilters,
    FinancialObligationPage,
    FinancialObligationRepository,
} from '../../domain/repositories/financial-obligation.repository'
import type {
    FinancialAccountData,
    FinancialCategoryData,
    FinancialRepository,
    FinancialTransactionData,
    FinancialTransactionFilters,
    FinancialTransactionPage,
} from '../../domain/repositories/financial.repository'

type AccountRow = {
    id: string
    organization_id: string
    name: string
    type: FinancialAccountType
    initial_balance: string
    current_balance: string
    projected_balance: string
    status: FinancialResourceStatus
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

type CategoryRow = {
    id: string
    organization_id: string
    name: string
    type: FinancialTransactionType
    status: FinancialResourceStatus
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

type TransactionRow = {
    id: string
    organization_id: string
    account_id: string | null
    category_id: string
    customer_id: string | null
    supplier_id: string | null
    employee_id: string | null
    origin_type: 'MANUAL' | 'LOAN_CHARGE'
    origin_id: string | null
    description: string
    notes: string | null
    type: FinancialTransactionType
    amount: string
    transaction_date: string
    due_date: string | null
    status: FinancialTransactionStatus
    paid_at: Date | null
    canceled_at: Date | null
    created_by: string
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

type ObligationRow = TransactionRow & {
    account_name: string | null
    category_name: string
    counterparty_name: string | null
}

const accountBalanceSelect = `
    SELECT
        accounts.*,
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
        )::NUMERIC(15, 2)::TEXT AS current_balance,
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
        )::NUMERIC(15, 2)::TEXT AS projected_balance
    FROM financial_accounts accounts
    LEFT JOIN financial_transactions transactions
        ON transactions.account_id = accounts.id
        AND transactions.deleted_at IS NULL
`

export class PostgresFinancialRepository
    implements
        FinancialRepository,
        FinancialDashboardRepository,
        FinancialObligationRepository
{
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async createAccount(
        data: FinancialAccountData,
    ): Promise<FinancialAccountEntity> {
        const [row] = await this.databaseClient.query<{ id: string }>(
            `
                INSERT INTO financial_accounts (
                    organization_id,
                    name,
                    type,
                    initial_balance,
                    status
                )
                VALUES (
                    :organizationId,
                    :name,
                    :type,
                    :initialBalance,
                    :status
                )
                RETURNING id
            `,
            data,
        )

        return (await this.findAccountById({
            id: row.id,
            organizationId: data.organizationId,
        }))!
    }

    async listAccounts(
        organizationId: string,
    ): Promise<FinancialAccountEntity[]> {
        const rows = await this.databaseClient.select<AccountRow>(
            `
                ${accountBalanceSelect}
                WHERE accounts.organization_id = :organizationId
                    AND accounts.deleted_at IS NULL
                GROUP BY accounts.id
                ORDER BY accounts.name ASC, accounts.created_at DESC
            `,
            { organizationId },
        )

        return rows.map((row) => this.toAccount(row))
    }

    async findAccountById(input: {
        id: string
        organizationId: string
    }): Promise<FinancialAccountEntity | null> {
        const [row] = await this.databaseClient.select<AccountRow>(
            `
                ${accountBalanceSelect}
                WHERE accounts.id = :id
                    AND accounts.organization_id = :organizationId
                    AND accounts.deleted_at IS NULL
                GROUP BY accounts.id
                LIMIT 1
            `,
            input,
        )

        return row ? this.toAccount(row) : null
    }

    async updateAccount(input: {
        id: string
        organizationId: string
        data: Omit<FinancialAccountData, 'organizationId'>
    }): Promise<FinancialAccountEntity | null> {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE financial_accounts
                SET name = :name,
                    type = :type,
                    initial_balance = :initialBalance,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND (
                        :status = 'PAID'
                        OR origin_type = 'MANUAL'
                    )
                    AND deleted_at IS NULL
                RETURNING id
            `,
            {
                ...input.data,
                id: input.id,
                organizationId: input.organizationId,
            },
        )

        if (!rows.length) {
            return null
        }

        return this.findAccountById(input)
    }

    async softDeleteAccount(input: {
        id: string
        organizationId: string
    }): Promise<boolean> {
        return this.softDelete('financial_accounts', input)
    }

    async accountHasTransactions(input: {
        id: string
        organizationId: string
    }): Promise<boolean> {
        return this.hasTransactions('account_id', input)
    }

    async createCategory(
        data: FinancialCategoryData,
    ): Promise<FinancialCategoryEntity> {
        const [row] = await this.databaseClient.query<CategoryRow>(
            `
                INSERT INTO financial_categories (
                    organization_id,
                    name,
                    type,
                    status
                )
                VALUES (:organizationId, :name, :type, :status)
                RETURNING *
            `,
            data,
        )

        return this.toCategory(row)
    }

    async listCategories(
        organizationId: string,
    ): Promise<FinancialCategoryEntity[]> {
        const rows = await this.databaseClient.select<CategoryRow>(
            `
                SELECT *
                FROM financial_categories
                WHERE organization_id = :organizationId
                    AND deleted_at IS NULL
                ORDER BY type ASC, name ASC
            `,
            { organizationId },
        )

        return rows.map((row) => this.toCategory(row))
    }

    async findCategoryById(input: {
        id: string
        organizationId: string
    }): Promise<FinancialCategoryEntity | null> {
        const [row] = await this.databaseClient.select<CategoryRow>(
            `
                SELECT *
                FROM financial_categories
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )

        return row ? this.toCategory(row) : null
    }

    async findCategoryByNameAndType(input: {
        organizationId: string
        name: string
        type: FinancialTransactionType
    }): Promise<FinancialCategoryEntity | null> {
        const [row] = await this.databaseClient.select<CategoryRow>(
            `
                SELECT *
                FROM financial_categories
                WHERE organization_id = :organizationId
                    AND type = :type
                    AND LOWER(name) = LOWER(:name)
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )

        return row ? this.toCategory(row) : null
    }

    async updateCategory(input: {
        id: string
        organizationId: string
        data: Omit<FinancialCategoryData, 'organizationId'>
    }): Promise<FinancialCategoryEntity | null> {
        const [row] = await this.databaseClient.query<CategoryRow>(
            `
                UPDATE financial_categories
                SET name = :name,
                    type = :type,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING *
            `,
            {
                ...input.data,
                id: input.id,
                organizationId: input.organizationId,
            },
        )

        return row ? this.toCategory(row) : null
    }

    async softDeleteCategory(input: {
        id: string
        organizationId: string
    }): Promise<boolean> {
        return this.softDelete('financial_categories', input)
    }

    async categoryHasTransactions(input: {
        id: string
        organizationId: string
    }): Promise<boolean> {
        return this.hasTransactions('category_id', input)
    }

    async createTransaction(
        data: FinancialTransactionData,
    ): Promise<FinancialTransactionEntity> {
        const [row] = await this.databaseClient.query<TransactionRow>(
            `
                INSERT INTO financial_transactions (
                    organization_id,
                    account_id,
                    category_id,
                    customer_id,
                    supplier_id,
                    employee_id,
                    origin_type,
                    origin_id,
                    description,
                    notes,
                    type,
                    amount,
                    transaction_date,
                    due_date,
                    created_by
                )
                VALUES (
                    :organizationId,
                    :accountId,
                    :categoryId,
                    :customerId,
                    :supplierId,
                    :employeeId,
                    :originType,
                    :originId,
                    :description,
                    :notes,
                    :type,
                    :amount,
                    :transactionDate,
                    :dueDate,
                    :createdBy
                )
                RETURNING *
            `,
            {
                ...data,
                employeeId: data.employeeId ?? null,
                originType: data.originType ?? 'MANUAL',
                originId: data.originId ?? null,
            },
        )

        return this.toTransaction(row)
    }

    async listTransactions(
        filters: FinancialTransactionFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<FinancialTransactionPage> {
        const { where, replacements } = this.transactionFilters(filters)
        const offset = (pagination.page - 1) * pagination.pageSize
        const rows = await this.databaseClient.select<TransactionRow>(
            `
                SELECT *
                FROM financial_transactions
                ${where}
                ORDER BY transaction_date DESC, created_at DESC
                LIMIT :pageSize OFFSET :offset
            `,
            { ...replacements, pageSize: pagination.pageSize, offset },
        )
        const [totals] = await this.databaseClient.select<{
            total: string
            paid_income: string
            paid_expense: string
            pending_income: string
            pending_expense: string
        }>(
            `
                SELECT
                    COUNT(*)::TEXT AS total,
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
                ${where}
            `,
            replacements,
        )

        return {
            items: rows.map((row) => this.toTransaction(row)),
            total: Number(totals.total),
            summary: {
                paidIncome: totals.paid_income,
                paidExpense: totals.paid_expense,
                pendingIncome: totals.pending_income,
                pendingExpense: totals.pending_expense,
            },
        }
    }

    async findTransactionById(input: {
        id: string
        organizationId: string
    }): Promise<FinancialTransactionEntity | null> {
        const [row] = await this.databaseClient.select<TransactionRow>(
            `
                SELECT *
                FROM financial_transactions
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )

        return row ? this.toTransaction(row) : null
    }

    async updateTransaction(input: {
        id: string
        organizationId: string
        data: Omit<FinancialTransactionData, 'organizationId' | 'createdBy'>
    }): Promise<FinancialTransactionEntity | null> {
        const [row] = await this.databaseClient.query<TransactionRow>(
            `
                UPDATE financial_transactions
                SET account_id = :accountId,
                    category_id = :categoryId,
                    customer_id = :customerId,
                    supplier_id = :supplierId,
                    employee_id = :employeeId,
                    description = :description,
                    notes = :notes,
                    type = :type,
                    amount = :amount,
                    transaction_date = :transactionDate,
                    due_date = :dueDate,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND status = 'PENDING'
                    AND origin_type = 'MANUAL'
                    AND deleted_at IS NULL
                RETURNING *
            `,
            {
                ...input.data,
                employeeId: input.data.employeeId ?? null,
                id: input.id,
                organizationId: input.organizationId,
            },
        )

        return row ? this.toTransaction(row) : null
    }

    async changeTransactionStatus(input: {
        id: string
        organizationId: string
        status: 'PAID' | 'CANCELED'
        settlementDate?: string
        accountId?: string
    }): Promise<FinancialTransactionEntity | null> {
        const [row] = await this.databaseClient.query<TransactionRow>(
            `
                UPDATE financial_transactions
                SET status = :status,
                    account_id = CASE
                        WHEN :status = 'PAID'
                            THEN COALESCE(:accountId, account_id)
                        ELSE account_id
                    END,
                    transaction_date = CASE
                        WHEN :status = 'PAID'
                            THEN COALESCE(:settlementDate, transaction_date)
                        ELSE transaction_date
                    END,
                    paid_at = CASE
                        WHEN :status = 'PAID'
                            THEN COALESCE(
                                CAST(:settlementDate AS DATE)::timestamptz,
                                NOW()
                            )
                        ELSE paid_at
                    END,
                    canceled_at = CASE
                        WHEN :status = 'CANCELED' THEN NOW()
                        ELSE NULL
                    END,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING *
            `,
            {
                ...input,
                settlementDate: input.settlementDate ?? null,
                accountId: input.accountId ?? null,
            },
        )

        return row ? this.toTransaction(row) : null
    }

    async softDeleteTransaction(input: {
        id: string
        organizationId: string
    }): Promise<boolean> {
        return this.softDelete('financial_transactions', input)
    }

    async counterpartyExists(input: {
        type: 'customer' | 'supplier' | 'employee'
        id: string
        organizationId: string
    }): Promise<boolean> {
        const table =
            input.type === 'customer'
                ? 'customers'
                : input.type === 'supplier'
                  ? 'suppliers'
                  : 'hr_employees'
        const rows = await this.databaseClient.select<{ id: string }>(
            `
                SELECT id
                FROM ${table}
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND status = 'ACTIVE'
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )

        return rows.length > 0
    }

    async listObligations(
        filters: FinancialObligationFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<FinancialObligationPage> {
        const { where, replacements } = this.obligationFilters(filters)
        const joins = this.obligationJoins(filters.type)
        const offset = (pagination.page - 1) * pagination.pageSize
        const rows = await this.databaseClient.select<ObligationRow>(
            `
                SELECT
                    transactions.*,
                    accounts.name AS account_name,
                    categories.name AS category_name,
                    counterparties.name AS counterparty_name
                FROM financial_transactions transactions
                ${joins}
                ${where}
                ORDER BY transactions.due_date ASC, transactions.created_at DESC
                LIMIT :pageSize OFFSET :offset
            `,
            { ...replacements, pageSize: pagination.pageSize, offset },
        )
        const [summary] = await this.databaseClient.select<{
            total: string
            pending_count: string
            pending_amount: string
            settled_count: string
            settled_amount: string
            overdue_count: string
            overdue_amount: string
        }>(
            `
                SELECT
                    COUNT(*)::TEXT AS total,
                    COUNT(*) FILTER (WHERE status = 'PENDING')::TEXT
                        AS pending_count,
                    COALESCE(SUM(amount) FILTER (
                        WHERE status = 'PENDING'
                    ), 0)::NUMERIC(15, 2)::TEXT AS pending_amount,
                    COUNT(*) FILTER (WHERE status = 'PAID')::TEXT
                        AS settled_count,
                    COALESCE(SUM(amount) FILTER (
                        WHERE status = 'PAID'
                    ), 0)::NUMERIC(15, 2)::TEXT AS settled_amount,
                    COUNT(*) FILTER (
                        WHERE status = 'PENDING' AND due_date < :today
                    )::TEXT AS overdue_count,
                    COALESCE(SUM(amount) FILTER (
                        WHERE status = 'PENDING' AND due_date < :today
                    ), 0)::NUMERIC(15, 2)::TEXT AS overdue_amount
                FROM financial_transactions transactions
                ${where}
            `,
            replacements,
        )

        return {
            items: rows.map((row) => this.toObligation(row, filters.type)),
            total: Number(summary.total),
            summary: {
                pendingCount: Number(summary.pending_count),
                pendingAmount: summary.pending_amount,
                settledCount: Number(summary.settled_count),
                settledAmount: summary.settled_amount,
                overdueCount: Number(summary.overdue_count),
                overdueAmount: summary.overdue_amount,
            },
        }
    }

    async findObligationById(input: {
        id: string
        organizationId: string
        type: FinancialTransactionType
        today: string
    }): Promise<FinancialObligationEntity | null> {
        const [row] = await this.databaseClient.select<ObligationRow>(
            `
                SELECT
                    transactions.*,
                    accounts.name AS account_name,
                    categories.name AS category_name,
                    counterparties.name AS counterparty_name
                FROM financial_transactions transactions
                ${this.obligationJoins(input.type)}
                WHERE transactions.id = :id
                    AND transactions.organization_id = :organizationId
                    AND transactions.type = :type
                    AND transactions.deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )

        return row ? this.toObligation(row, input.type) : null
    }

    async getDashboard(
        query: FinancialDashboardQuery,
    ): Promise<FinancialDashboardData> {
        const [accounts, cashFlow, monthlyFlow, categories, overdue, upcoming] =
            await Promise.all([
                this.listAccounts(query.organizationId),
                this.dashboardCashFlow(query),
                this.dashboardMonthlyFlow(query),
                this.dashboardCategories(query),
                this.dashboardDueGroup(query, 'overdue'),
                this.dashboardDueGroup(query, 'upcoming'),
            ])

        return {
            accounts,
            cashFlow,
            monthlyFlow,
            incomeCategories: categories.filter(
                (category) => category.type === 'INCOME',
            ),
            expenseCategories: categories.filter(
                (category) => category.type === 'EXPENSE',
            ),
            overdue,
            upcoming,
        }
    }

    private transactionFilters(filters: FinancialTransactionFilters) {
        const clauses = [
            'organization_id = :organizationId',
            'deleted_at IS NULL',
        ]
        const replacements: Record<string, unknown> = {
            organizationId: filters.organizationId,
        }
        const optionalFilters: Array<
            [keyof FinancialTransactionFilters, string]
        > = [
            ['accountId', 'account_id'],
            ['categoryId', 'category_id'],
            ['customerId', 'customer_id'],
            ['supplierId', 'supplier_id'],
            ['employeeId', 'employee_id'],
            ['type', 'type'],
            ['status', 'status'],
        ]

        for (const [key, column] of optionalFilters) {
            const value = filters[key]
            if (value !== undefined) {
                clauses.push(`${column} = :${key}`)
                replacements[key] = value
            }
        }
        if (filters.startDate) {
            clauses.push('transaction_date >= :startDate')
            replacements.startDate = filters.startDate
        }
        if (filters.endDate) {
            clauses.push('transaction_date <= :endDate')
            replacements.endDate = filters.endDate
        }

        return {
            where: `WHERE ${clauses.join('\n AND ')}`,
            replacements,
        }
    }

    private obligationFilters(filters: FinancialObligationFilters) {
        const clauses = [
            'transactions.organization_id = :organizationId',
            'transactions.type = :type',
            'transactions.deleted_at IS NULL',
        ]
        const replacements: Record<string, unknown> = {
            organizationId: filters.organizationId,
            type: filters.type,
            today: filters.today,
        }
        const optional: Array<[string, unknown, string]> = [
            ['status', filters.status, 'transactions.status'],
            ['accountId', filters.accountId, 'transactions.account_id'],
            ['categoryId', filters.categoryId, 'transactions.category_id'],
            [
                'counterpartyId',
                filters.counterpartyId,
                filters.type === 'EXPENSE'
                    ? 'transactions.supplier_id'
                    : 'transactions.customer_id',
            ],
        ]
        for (const [key, value, column] of optional) {
            if (value !== undefined) {
                clauses.push(`${column} = :${key}`)
                replacements[key] = value
            }
        }
        if (filters.dueDateStart) {
            clauses.push('transactions.due_date >= :dueDateStart')
            replacements.dueDateStart = filters.dueDateStart
        }
        if (filters.dueDateEnd) {
            clauses.push('transactions.due_date <= :dueDateEnd')
            replacements.dueDateEnd = filters.dueDateEnd
        }
        if (filters.overdue !== undefined) {
            clauses.push(
                filters.overdue
                    ? "transactions.status = 'PENDING' AND transactions.due_date < :today"
                    : "NOT (transactions.status = 'PENDING' AND transactions.due_date < :today)",
            )
        }
        return {
            where: `WHERE ${clauses.join('\n AND ')}`,
            replacements,
        }
    }

    private obligationJoins(type: FinancialTransactionType): string {
        const table = type === 'EXPENSE' ? 'suppliers' : 'customers'
        const foreignKey = type === 'EXPENSE' ? 'supplier_id' : 'customer_id'
        return `
            LEFT JOIN financial_accounts accounts
                ON accounts.id = transactions.account_id
            INNER JOIN financial_categories categories
                ON categories.id = transactions.category_id
            LEFT JOIN ${table} counterparties
                ON counterparties.id = transactions.${foreignKey}
        `
    }

    private async dashboardCashFlow(query: FinancialDashboardQuery) {
        const [row] = await this.databaseClient.select<{
            paid_income: string
            paid_expense: string
            pending_income: string
            pending_expense: string
        }>(
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

    private async dashboardMonthlyFlow(query: FinancialDashboardQuery) {
        const rows = await this.databaseClient.select<{
            year: string
            month: string
            income: string
            expense: string
            result: string
        }>(
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

    private async dashboardCategories(
        query: FinancialDashboardQuery,
    ): Promise<FinancialDashboardCategory[]> {
        const rows = await this.databaseClient.select<{
            category_id: string
            name: string
            type: FinancialTransactionType
            amount: string
            percentage: string
        }>(
            `
                WITH category_totals AS (
                    SELECT
                        categories.id AS category_id,
                        categories.name,
                        transactions.type,
                        SUM(transactions.amount) AS amount
                    FROM financial_transactions transactions
                    INNER JOIN financial_categories categories
                        ON categories.id = transactions.category_id
                    WHERE transactions.organization_id = :organizationId
                        AND transactions.status = 'PAID'
                        AND transactions.transaction_date
                            BETWEEN :periodStart AND :periodEnd
                        AND transactions.deleted_at IS NULL
                    GROUP BY categories.id, categories.name, transactions.type
                ),
                ranked AS (
                    SELECT
                        category_totals.*,
                        SUM(amount) OVER (PARTITION BY type) AS type_total,
                        ROW_NUMBER() OVER (
                            PARTITION BY type
                            ORDER BY amount DESC, name ASC
                        ) AS position
                    FROM category_totals
                )
                SELECT
                    category_id,
                    name,
                    type,
                    amount::NUMERIC(15, 2)::TEXT AS amount,
                    (
                        amount / NULLIF(type_total, 0) * 100
                    )::NUMERIC(7, 2)::TEXT AS percentage
                FROM ranked
                WHERE position <= 5
                ORDER BY type, position
            `,
            query,
        )

        return rows.map((row) => ({
            categoryId: row.category_id,
            name: row.name,
            type: row.type,
            amount: row.amount,
            percentage: row.percentage,
        }))
    }

    private async dashboardDueGroup(
        query: FinancialDashboardQuery,
        group: 'overdue' | 'upcoming',
    ): Promise<FinancialDashboardDueGroup> {
        const dateCondition =
            group === 'overdue'
                ? 'due_date < :today'
                : 'due_date BETWEEN :today AND :upcomingEnd'
        const replacements = query
        const [totals] = await this.databaseClient.select<{
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
                    AND ${dateCondition}
                    AND deleted_at IS NULL
            `,
            replacements,
        )
        const items = await this.databaseClient.select<TransactionRow>(
            `
                SELECT *
                FROM financial_transactions
                WHERE organization_id = :organizationId
                    AND status = 'PENDING'
                    AND ${dateCondition}
                    AND deleted_at IS NULL
                ORDER BY due_date ASC, created_at ASC
                LIMIT 5
            `,
            replacements,
        )

        return {
            count: Number(totals.count),
            income: totals.income,
            expense: totals.expense,
            items: items.map((row) => this.toTransaction(row)),
        }
    }

    private async softDelete(
        table:
            | 'financial_accounts'
            | 'financial_categories'
            | 'financial_transactions',
        input: { id: string; organizationId: string },
    ): Promise<boolean> {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE ${table}
                SET deleted_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                    AND (
                        '${table}' <> 'financial_transactions'
                        OR origin_type = 'MANUAL'
                    )
                RETURNING id
            `,
            input,
        )

        return rows.length > 0
    }

    private async hasTransactions(
        column: 'account_id' | 'category_id',
        input: { id: string; organizationId: string },
    ): Promise<boolean> {
        const rows = await this.databaseClient.select<{ id: string }>(
            `
                SELECT id
                FROM financial_transactions
                WHERE ${column} = :id
                    AND organization_id = :organizationId
                LIMIT 1
            `,
            input,
        )

        return rows.length > 0
    }

    private toAccount(row: AccountRow): FinancialAccountEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            type: row.type,
            initialBalance: row.initial_balance,
            currentBalance: row.current_balance,
            projectedBalance: row.projected_balance,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        }
    }

    private toCategory(row: CategoryRow): FinancialCategoryEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            type: row.type,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        }
    }

    private toTransaction(row: TransactionRow): FinancialTransactionEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            accountId: row.account_id,
            categoryId: row.category_id,
            customerId: row.customer_id,
            supplierId: row.supplier_id,
            employeeId: row.employee_id,
            originType: row.origin_type,
            originId: row.origin_id,
            description: row.description,
            notes: row.notes,
            type: row.type,
            amount: row.amount,
            transactionDate: String(row.transaction_date),
            dueDate: row.due_date ? String(row.due_date) : null,
            status: row.status,
            paidAt: row.paid_at ? new Date(row.paid_at) : null,
            canceledAt: row.canceled_at ? new Date(row.canceled_at) : null,
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        }
    }

    private toObligation(
        row: ObligationRow,
        type: FinancialTransactionType,
    ): FinancialObligationEntity {
        const transaction = this.toTransaction(row)
        const counterpartyId =
            type === 'EXPENSE' ? row.supplier_id : row.customer_id
        return {
            ...transaction,
            account:
                row.account_id && row.account_name
                    ? { id: row.account_id, name: row.account_name }
                    : null,
            category: { id: row.category_id, name: row.category_name },
            counterparty:
                counterpartyId && row.counterparty_name
                    ? { id: counterpartyId, name: row.counterparty_name }
                    : null,
        }
    }
}
