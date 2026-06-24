import type {
    LoanBorrowerType,
    LoanChargeType,
    LoanEntity,
    LoanOccurrenceType,
    LoanStatus,
} from '../entities/loan.entity'

export type LoanItemData = {
    variantId: string
    quantity: string
    notes: string | null
}

export type LoanChargeData = {
    type: LoanChargeType
    categoryId: string
    amount: string
    dueDate: string
    description: string
    occurrenceId: string | null
    idempotencyKey: string | null
}

export type LoanFilters = {
    organizationId: string
    status?: LoanStatus
    borrowerType?: LoanBorrowerType
    borrowerId?: string
    overdue?: boolean
    search?: string
    startDate?: string
    endDate?: string
}

export interface LoanRepository {
    createLoan(input: {
        organizationId: string
        borrowerType: LoanBorrowerType
        customerId: string | null
        employeeId: string | null
        expectedReturnDate: string
        notes: string | null
        items: LoanItemData[]
        createdBy: string
    }): Promise<LoanEntity>
    listLoans(
        filters: LoanFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<{ items: LoanEntity[]; total: number }>
    findLoanById(input: {
        id: string
        organizationId: string
    }): Promise<LoanEntity | null>
    updateDraft(input: {
        id: string
        organizationId: string
        borrowerType: LoanBorrowerType
        customerId: string | null
        employeeId: string | null
        expectedReturnDate: string
        notes: string | null
        items: LoanItemData[]
    }): Promise<LoanEntity | null>
    releaseLoan(input: {
        id: string
        organizationId: string
        releasedAt: Date
        createdBy: string
        initialCharge: LoanChargeData | null
    }): Promise<LoanEntity>
    cancelDraft(input: {
        id: string
        organizationId: string
    }): Promise<LoanEntity | null>
    createReturn(input: {
        id: string
        organizationId: string
        returnedAt: Date
        notes: string | null
        createdBy: string
        idempotencyKey: string | null
        items: Array<{ loanItemId: string; quantity: string }>
    }): Promise<LoanEntity>
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
    }): Promise<LoanEntity>
    createCharge(input: {
        id: string
        organizationId: string
        createdBy: string
        charge: LoanChargeData
    }): Promise<LoanEntity>
    cancelCharge(input: {
        id: string
        chargeId: string
        organizationId: string
    }): Promise<LoanEntity>
    customerIsActive(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    employeeIsActive(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    incomeCategoryIsActive(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
}
