export type LoanBorrowerType = 'CUSTOMER' | 'EMPLOYEE'
export type LoanStatus =
    | 'DRAFT'
    | 'RELEASED'
    | 'PARTIALLY_RETURNED'
    | 'COMPLETED'
    | 'CANCELED'
export type LoanOccurrenceType = 'LOSS' | 'DAMAGE'
export type LoanChargeType = 'FEE' | 'LATE_FEE' | 'DAMAGE'

export type LoanItemEntity = {
    id: string
    organizationId: string
    loanId: string
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
}

export type LoanChargeEntity = {
    id: string
    organizationId: string
    loanId: string
    occurrenceId: string | null
    financialTransactionId: string | null
    type: LoanChargeType
    categoryId: string
    amount: string
    dueDate: string
    description: string
    canceledAt: Date | null
    createdAt: Date
}

export type LoanEventItemEntity = {
    id: string
    loanItemId: string
    quantity: string
}

export type LoanReturnEntity = {
    id: string
    organizationId: string
    loanId: string
    returnedAt: Date
    notes: string | null
    createdBy: string
    createdAt: Date
    items: LoanEventItemEntity[]
}

export type LoanOccurrenceEntity = {
    id: string
    organizationId: string
    loanId: string
    type: LoanOccurrenceType
    occurredAt: Date
    description: string | null
    createdBy: string
    createdAt: Date
    items: LoanEventItemEntity[]
}

export type LoanEntity = {
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
    releasedAt: Date | null
    completedAt: Date | null
    canceledAt: Date | null
    notes: string | null
    createdBy: string
    creatorName: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    items: LoanItemEntity[]
    returns: LoanReturnEntity[]
    occurrences: LoanOccurrenceEntity[]
    charges: LoanChargeEntity[]
}
