export type FinancialResourceStatus = 'ACTIVE' | 'INACTIVE'
export type FinancialAccountType = 'CASH' | 'BANK' | 'DIGITAL_WALLET'
export type FinancialTransactionType = 'INCOME' | 'EXPENSE'
export type FinancialTransactionStatus = 'PENDING' | 'PAID' | 'CANCELED'

export type FinancialAccountEntity = {
    id: string
    organizationId: string
    name: string
    type: FinancialAccountType
    initialBalance: string
    currentBalance: string
    projectedBalance: string
    status: FinancialResourceStatus
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export type FinancialCategoryEntity = {
    id: string
    organizationId: string
    name: string
    type: FinancialTransactionType
    status: FinancialResourceStatus
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export type FinancialTransactionEntity = {
    id: string
    organizationId: string
    accountId: string
    categoryId: string
    customerId: string | null
    supplierId: string | null
    description: string
    notes: string | null
    type: FinancialTransactionType
    amount: string
    transactionDate: string
    dueDate: string | null
    status: FinancialTransactionStatus
    paidAt: Date | null
    canceledAt: Date | null
    createdBy: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export type FinancialTransactionSummary = {
    paidIncome: string
    paidExpense: string
    pendingIncome: string
    pendingExpense: string
}
