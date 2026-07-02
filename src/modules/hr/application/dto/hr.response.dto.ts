import type {
    EmployeeAssignmentEntity,
    EmployeeEntity,
    HrCatalogEntity,
    HrSummaryEntity,
    PayrollProvisionEntity,
    SalaryChangeEntity,
} from '../../domain/entities/hr.entity'

export type HrCatalogResponseDto = ReturnType<typeof toHrCatalogResponseDto>
export type EmployeeResponseDto = ReturnType<typeof toEmployeeResponseDto>
export type EmployeeAssignmentResponseDto = ReturnType<
    typeof toEmployeeAssignmentResponseDto
>
export type SalaryChangeResponseDto = ReturnType<
    typeof toSalaryChangeResponseDto
>
export type HrSummaryResponseDto = HrSummaryEntity
export type PayrollProvisionResponseDto = ReturnType<
    typeof toPayrollProvisionResponseDto
>

export const toHrCatalogResponseDto = (entity: HrCatalogEntity) => ({
    ...entity,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    deletedAt: entity.deletedAt?.toISOString() ?? null,
})

export const toEmployeeResponseDto = (entity: EmployeeEntity) => ({
    id: entity.id,
    organizationId: entity.organizationId,
    organizationUserId: entity.organizationUserId,
    member:
        entity.organizationUserId && entity.memberName && entity.memberEmail
            ? {
                  organizationUserId: entity.organizationUserId,
                  name: entity.memberName,
                  email: entity.memberEmail,
              }
            : null,
    department: {
        id: entity.departmentId,
        name: entity.departmentName,
    },
    position: { id: entity.positionId, name: entity.positionName },
    name: entity.name,
    cpf: entity.cpf,
    registration: entity.registration,
    email: entity.email,
    phone: entity.phone,
    birthDate: entity.birthDate,
    hireDate: entity.hireDate,
    status: entity.status,
    terminationDate: entity.terminationDate,
    terminationReason: entity.terminationReason,
    notes: entity.notes,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
    deletedAt: entity.deletedAt?.toISOString() ?? null,
})

export const toEmployeeAssignmentResponseDto = (
    entity: EmployeeAssignmentEntity,
) => ({
    ...entity,
    createdAt: entity.createdAt.toISOString(),
})

export const toSalaryChangeResponseDto = (entity: SalaryChangeEntity) => ({
    ...entity,
    createdAt: entity.createdAt.toISOString(),
})

export const toPayrollProvisionResponseDto = (
    entity: PayrollProvisionEntity,
) => ({
    id: entity.id,
    organizationId: entity.organizationId,
    year: entity.year,
    month: entity.month,
    amount: entity.amount,
    employeeCount: entity.employeeCount,
    financialPayableId: entity.financialPayableId,
    createdAt: entity.createdAt.toISOString(),
})
