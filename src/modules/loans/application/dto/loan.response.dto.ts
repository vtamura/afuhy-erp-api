import type {
    LoanBorrowerType,
    LoanChargeType,
    LoanOccurrenceType,
    LoanStatus,
} from '../../domain/entities/loan.entity'

export type LoanResponseDto = {
    id: string
    organizationId: string
    borrowerType: LoanBorrowerType
    customerId: string | null
    customerName: string | null
    employeeId: string | null
    employeeName: string | null
    status: LoanStatus
    expectedReturnDate: string
    isOverdue: boolean
    releasedAt: string | null
    completedAt: string | null
    canceledAt: string | null
    notes: string | null
    createdBy: string
    creatorName: string
    createdAt: string
    updatedAt: string
    items: Array<{
        id: string
        variantId: string
        productName: string
        variantName: string
        variantSku: string
        quantityReleased: string
        quantityReturned: string
        quantityLost: string
        quantityDamaged: string
        pendingQuantity: string
        unitCostSnapshot: string
        notes: string | null
    }>
    returns: Array<{
        id: string
        returnedAt: string
        notes: string | null
        createdBy: string
        createdAt: string
        items: Array<{ id: string; loanItemId: string; quantity: string }>
    }>
    occurrences: Array<{
        id: string
        type: LoanOccurrenceType
        occurredAt: string
        description: string | null
        createdBy: string
        createdAt: string
        items: Array<{ id: string; loanItemId: string; quantity: string }>
    }>
    charges: Array<{
        id: string
        occurrenceId: string | null
        financialTransactionId: string | null
        type: LoanChargeType
        categoryId: string
        amount: string
        dueDate: string
        description: string
        canceledAt: string | null
        createdAt: string
    }>
}

export type LoanListResponseDto = {
    items: LoanResponseDto[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}
