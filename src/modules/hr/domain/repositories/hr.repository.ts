import type {
    EmployeeAssignmentEntity,
    EmployeeEntity,
    EmployeeStatus,
    HrCatalogEntity,
    HrCatalogStatus,
    HrSummaryEntity,
    SalaryChangeEntity,
} from '../entities/hr.entity'

export type HrCatalogType = 'department' | 'position'
export type HrCatalogData = {
    organizationId: string
    name: string
    description: string | null
    status: HrCatalogStatus
}
export type EmployeeData = {
    organizationId: string
    organizationUserId: string | null
    departmentId: string
    positionId: string
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
}
export type EmployeeFilters = {
    organizationId: string
    status?: EmployeeStatus
    departmentId?: string
    positionId?: string
    organizationUserId?: string
    search?: string
}

export interface HrRepository {
    createCatalog(
        type: HrCatalogType,
        data: HrCatalogData,
    ): Promise<HrCatalogEntity>
    listCatalog(
        type: HrCatalogType,
        organizationId: string,
    ): Promise<HrCatalogEntity[]>
    findCatalogById(input: {
        type: HrCatalogType
        id: string
        organizationId: string
    }): Promise<HrCatalogEntity | null>
    findCatalogByName(input: {
        type: HrCatalogType
        organizationId: string
        name: string
    }): Promise<HrCatalogEntity | null>
    updateCatalog(input: {
        type: HrCatalogType
        id: string
        organizationId: string
        data: Omit<HrCatalogData, 'organizationId'>
    }): Promise<HrCatalogEntity | null>
    deleteCatalog(input: {
        type: HrCatalogType
        id: string
        organizationId: string
    }): Promise<boolean>
    catalogHasReferences(input: {
        type: HrCatalogType
        id: string
        organizationId: string
    }): Promise<boolean>

    createEmployee(input: {
        data: EmployeeData
        createdBy: string
    }): Promise<EmployeeEntity>
    listEmployees(
        filters: EmployeeFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<{ items: EmployeeEntity[]; total: number }>
    findEmployeeById(input: {
        id: string
        organizationId: string
    }): Promise<EmployeeEntity | null>
    findEmployeeByUnique(input: {
        organizationId: string
        field: 'cpf' | 'registration' | 'organization_user_id'
        value: string
    }): Promise<EmployeeEntity | null>
    updateEmployee(input: {
        id: string
        organizationId: string
        data: Omit<
            EmployeeData,
            'organizationId' | 'departmentId' | 'positionId' | 'currentSalary'
        >
    }): Promise<EmployeeEntity | null>
    deleteEmployee(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    employeeHasAdditionalHistory(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    memberIsActive(input: {
        id: string
        organizationId: string
    }): Promise<boolean>

    createAssignment(input: {
        employeeId: string
        organizationId: string
        departmentId: string
        positionId: string
        effectiveDate: string
        reason: string | null
        createdBy: string
    }): Promise<EmployeeAssignmentEntity>
    listAssignments(input: {
        employeeId: string
        organizationId: string
    }): Promise<EmployeeAssignmentEntity[]>
    createSalaryChange(input: {
        employeeId: string
        organizationId: string
        salary: string
        effectiveDate: string
        reason: string | null
        createdBy: string
    }): Promise<SalaryChangeEntity>
    listSalaryChanges(input: {
        employeeId: string
        organizationId: string
    }): Promise<SalaryChangeEntity[]>
    getSummary(input: {
        organizationId: string
        periodStart: string
        periodEnd: string
    }): Promise<HrSummaryEntity>
}
