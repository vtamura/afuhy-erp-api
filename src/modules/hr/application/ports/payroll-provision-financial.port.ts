import type { PayrollProvisionEntity } from '../../domain/entities/hr.entity'

export type CreatePayrollProvisionInput = {
    organizationId: string
    createdBy: string
    year: number
    month: number
    dueDate: string
    accountId: string
    categoryId: string
}

export interface PayrollProvisionFinancialPort {
    createPayrollProvision(
        input: CreatePayrollProvisionInput,
    ): Promise<PayrollProvisionEntity>
}
