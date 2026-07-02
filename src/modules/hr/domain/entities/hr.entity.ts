export type HrCatalogStatus = 'ACTIVE' | 'INACTIVE'
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'

export type HrCatalogEntity = {
    id: string
    organizationId: string
    name: string
    description: string | null
    status: HrCatalogStatus
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export type EmployeeEntity = {
    id: string
    organizationId: string
    organizationUserId: string | null
    memberName: string | null
    memberEmail: string | null
    departmentId: string
    departmentName: string
    positionId: string
    positionName: string
    name: string
    cpf: string
    registration: string
    email: string | null
    phone: string | null
    birthDate: string | null
    hireDate: string
    currentSalary: string
    status: EmployeeStatus
    terminationDate: string | null
    terminationReason: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export type EmployeeAssignmentEntity = {
    id: string
    organizationId: string
    employeeId: string
    departmentId: string
    departmentName: string
    positionId: string
    positionName: string
    effectiveDate: string
    reason: string | null
    createdBy: string
    creatorName: string
    createdAt: Date
}

export type SalaryChangeEntity = {
    id: string
    organizationId: string
    employeeId: string
    salary: string
    effectiveDate: string
    reason: string | null
    createdBy: string
    creatorName: string
    createdAt: Date
}

export type HrSummaryEntity = {
    totalEmployees: number
    byStatus: Array<{ status: EmployeeStatus; total: number }>
    byDepartment: Array<{ id: string; name: string; total: number }>
    byPosition: Array<{ id: string; name: string; total: number }>
    admissions: number
    terminations: number
    periodStart: string
    periodEnd: string
}

export type PayrollProvisionEntity = {
    id: string
    organizationId: string
    year: number
    month: number
    amount: string
    employeeCount: number
    financialPayableId: string
    createdAt: Date
}
