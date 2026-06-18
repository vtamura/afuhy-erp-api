import type {
    FinancialAccountEntity,
    FinancialAccountType,
    FinancialCategoryEntity,
    FinancialResourceStatus,
    FinancialTransactionEntity,
    FinancialTransactionStatus,
    FinancialTransactionSummary,
    FinancialTransactionType,
} from '../entities/financial.entity'

export type FinancialAccountData = {
    organizationId: string
    name: string
    type: FinancialAccountType
    initialBalance: string
    status: FinancialResourceStatus
}

export type FinancialCategoryData = {
    organizationId: string
    name: string
    type: FinancialTransactionType
    status: FinancialResourceStatus
}

export type FinancialTransactionData = {
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
    createdBy: string
}

export type FinancialTransactionFilters = {
    organizationId: string
    accountId?: string
    categoryId?: string
    customerId?: string
    supplierId?: string
    type?: FinancialTransactionType
    status?: FinancialTransactionStatus
    startDate?: string
    endDate?: string
}

export type FinancialTransactionPage = {
    items: FinancialTransactionEntity[]
    total: number
    summary: FinancialTransactionSummary
}

export interface FinancialRepository {
    createAccount(data: FinancialAccountData): Promise<FinancialAccountEntity>
    listAccounts(organizationId: string): Promise<FinancialAccountEntity[]>
    findAccountById(input: {
        id: string
        organizationId: string
    }): Promise<FinancialAccountEntity | null>
    updateAccount(input: {
        id: string
        organizationId: string
        data: Omit<FinancialAccountData, 'organizationId'>
    }): Promise<FinancialAccountEntity | null>
    softDeleteAccount(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    accountHasTransactions(input: {
        id: string
        organizationId: string
    }): Promise<boolean>

    createCategory(
        data: FinancialCategoryData,
    ): Promise<FinancialCategoryEntity>
    listCategories(organizationId: string): Promise<FinancialCategoryEntity[]>
    findCategoryById(input: {
        id: string
        organizationId: string
    }): Promise<FinancialCategoryEntity | null>
    findCategoryByNameAndType(input: {
        organizationId: string
        name: string
        type: FinancialTransactionType
    }): Promise<FinancialCategoryEntity | null>
    updateCategory(input: {
        id: string
        organizationId: string
        data: Omit<FinancialCategoryData, 'organizationId'>
    }): Promise<FinancialCategoryEntity | null>
    softDeleteCategory(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    categoryHasTransactions(input: {
        id: string
        organizationId: string
    }): Promise<boolean>

    createTransaction(
        data: FinancialTransactionData,
    ): Promise<FinancialTransactionEntity>
    listTransactions(
        filters: FinancialTransactionFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<FinancialTransactionPage>
    findTransactionById(input: {
        id: string
        organizationId: string
    }): Promise<FinancialTransactionEntity | null>
    updateTransaction(input: {
        id: string
        organizationId: string
        data: Omit<FinancialTransactionData, 'organizationId' | 'createdBy'>
    }): Promise<FinancialTransactionEntity | null>
    changeTransactionStatus(input: {
        id: string
        organizationId: string
        status: Extract<FinancialTransactionStatus, 'PAID' | 'CANCELED'>
        settlementDate?: string
    }): Promise<FinancialTransactionEntity | null>
    softDeleteTransaction(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    counterpartyExists(input: {
        type: 'customer' | 'supplier'
        id: string
        organizationId: string
    }): Promise<boolean>
}
