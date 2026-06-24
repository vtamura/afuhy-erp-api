import type {
    FinancialTransactionEntity,
    FinancialTransactionStatus,
    FinancialTransactionType,
} from '../entities/financial.entity'

export type FinancialObligationKind = 'payable' | 'receivable'

export type FinancialObligationEntity = FinancialTransactionEntity & {
    account: { id: string; name: string } | null
    category: { id: string; name: string }
    counterparty: { id: string; name: string } | null
}

export type FinancialObligationFilters = {
    organizationId: string
    type: FinancialTransactionType
    status?: FinancialTransactionStatus
    accountId?: string
    categoryId?: string
    counterpartyId?: string
    dueDateStart?: string
    dueDateEnd?: string
    overdue?: boolean
    today: string
}

export type FinancialObligationPage = {
    items: FinancialObligationEntity[]
    total: number
    summary: {
        pendingCount: number
        pendingAmount: string
        settledCount: number
        settledAmount: string
        overdueCount: number
        overdueAmount: string
    }
}

export interface FinancialObligationRepository {
    listObligations(
        filters: FinancialObligationFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<FinancialObligationPage>
    findObligationById(input: {
        id: string
        organizationId: string
        type: FinancialTransactionType
        today: string
    }): Promise<FinancialObligationEntity | null>
}
