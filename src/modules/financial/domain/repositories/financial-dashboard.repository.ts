import type {
    FinancialAccountEntity,
    FinancialTransactionEntity,
    FinancialTransactionType,
} from '../entities/financial.entity'

export type FinancialDashboardQuery = {
    organizationId: string
    periodStart: string
    periodEnd: string
    seriesStart: string
    today: string
    upcomingEnd: string
}

export type FinancialDashboardCashFlow = {
    paidIncome: string
    paidExpense: string
    pendingIncome: string
    pendingExpense: string
}

export type FinancialDashboardMonthlyFlow = {
    year: number
    month: number
    income: string
    expense: string
    result: string
}

export type FinancialDashboardCategory = {
    categoryId: string
    name: string
    type: FinancialTransactionType
    amount: string
    percentage: string
}

export type FinancialDashboardDueGroup = {
    count: number
    income: string
    expense: string
    items: FinancialTransactionEntity[]
}

export type FinancialDashboardData = {
    accounts: FinancialAccountEntity[]
    cashFlow: FinancialDashboardCashFlow
    monthlyFlow: FinancialDashboardMonthlyFlow[]
    incomeCategories: FinancialDashboardCategory[]
    expenseCategories: FinancialDashboardCategory[]
    overdue: FinancialDashboardDueGroup
    upcoming: FinancialDashboardDueGroup
}

export interface FinancialDashboardRepository {
    getDashboard(
        query: FinancialDashboardQuery,
    ): Promise<FinancialDashboardData>
}
