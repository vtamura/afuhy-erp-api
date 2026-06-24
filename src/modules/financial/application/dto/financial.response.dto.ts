export type FinancialAccountResponseDto = {
    id: string
    organizationId: string
    name: string
    type: 'CASH' | 'BANK' | 'DIGITAL_WALLET'
    initialBalance: string
    currentBalance: string
    projectedBalance: string
    status: 'ACTIVE' | 'INACTIVE'
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type FinancialCategoryResponseDto = {
    id: string
    organizationId: string
    name: string
    type: 'INCOME' | 'EXPENSE'
    status: 'ACTIVE' | 'INACTIVE'
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type FinancialTransactionResponseDto = {
    id: string
    organizationId: string
    accountId: string | null
    categoryId: string
    customerId: string | null
    supplierId: string | null
    employeeId: string | null
    originType: 'MANUAL' | 'LOAN_CHARGE'
    originId: string | null
    description: string
    notes: string | null
    type: 'INCOME' | 'EXPENSE'
    amount: string
    transactionDate: string
    dueDate: string | null
    status: 'PENDING' | 'PAID' | 'CANCELED'
    paidAt: string | null
    canceledAt: string | null
    createdBy: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type FinancialTransactionListResponseDto = {
    items: FinancialTransactionResponseDto[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
    summary: {
        paidIncome: string
        paidExpense: string
        pendingIncome: string
        pendingExpense: string
    }
}

export type FinancialDashboardResponseDto = {
    period: {
        year: number
        month: number
        startDate: string
        endDate: string
    }
    balances: {
        current: string
        projected: string
    }
    cashFlow: {
        paidIncome: string
        paidExpense: string
        result: string
        pendingIncome: string
        pendingExpense: string
    }
    accounts: FinancialAccountResponseDto[]
    monthlyFlow: Array<{
        year: number
        month: number
        income: string
        expense: string
        result: string
    }>
    categories: {
        income: Array<{
            categoryId: string
            name: string
            amount: string
            percentage: string
        }>
        expense: Array<{
            categoryId: string
            name: string
            amount: string
            percentage: string
        }>
    }
    overdue: FinancialDashboardDueGroupResponseDto
    upcoming: FinancialDashboardDueGroupResponseDto
}

export type FinancialDashboardDueGroupResponseDto = {
    count: number
    income: string
    expense: string
    items: FinancialTransactionResponseDto[]
}

export type FinancialObligationResponseDto = FinancialTransactionResponseDto & {
    account: { id: string; name: string } | null
    category: { id: string; name: string }
    counterparty: { id: string; name: string } | null
    isOverdue: boolean
}

export type FinancialObligationListResponseDto = {
    items: FinancialObligationResponseDto[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
    summary: {
        pendingCount: number
        pendingAmount: string
        settledCount: number
        settledAmount: string
        overdueCount: number
        overdueAmount: string
    }
}
