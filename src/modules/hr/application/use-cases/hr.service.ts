import {
    BadRequestError,
    ConflictError,
    NotFoundError,
    UnauthorizedError,
} from '../../../../shared/domain/errors'
import type {
    ContractType,
    EmployeeStatus,
    HrCatalogStatus,
    PayFrequency,
} from '../../domain/entities/hr.entity'
import type {
    EmployeeData,
    EmployeeFilters,
    HrCatalogType,
    HrRepository,
} from '../../domain/repositories/hr.repository'
import type { PayrollProvisionFinancialPort } from '../ports/payroll-provision-financial.port'
import {
    toEmployeeAssignmentResponseDto,
    toEmployeeResponseDto,
    toHrCatalogResponseDto,
    toPayrollProvisionResponseDto,
    toSalaryChangeResponseDto,
} from '../dto'

const requireOrganization = (organizationId: string | null) => {
    if (!organizationId)
        throw new UnauthorizedError('Organizacao ativa obrigatoria')
    return organizationId
}

const ensureDateOrder = (earlier: string, later: string, message: string) => {
    if (later < earlier) throw new BadRequestError(message)
}

export class HrService {
    constructor(
        private readonly repository: HrRepository,
        private readonly payrollProvisionFinancialPort: PayrollProvisionFinancialPort,
    ) {}

    async createCatalog(input: {
        type: HrCatalogType
        organizationId: string | null
        name: string
        description: string | null
        status: HrCatalogStatus
    }) {
        const organizationId = requireOrganization(input.organizationId)
        if (
            await this.repository.findCatalogByName({
                type: input.type,
                organizationId,
                name: input.name,
            })
        )
            throw new ConflictError('Nome ja utilizado')
        return toHrCatalogResponseDto(
            await this.repository.createCatalog(input.type, {
                organizationId,
                name: input.name,
                description: input.description,
                status: input.status,
            }),
        )
    }

    async listCatalog(input: {
        type: HrCatalogType
        organizationId: string | null
    }) {
        return Promise.all(
            (
                await this.repository.listCatalog(
                    input.type,
                    requireOrganization(input.organizationId),
                )
            ).map(toHrCatalogResponseDto),
        )
    }

    async getCatalog(input: {
        type: HrCatalogType
        id: string
        organizationId: string | null
    }) {
        const entity = await this.repository.findCatalogById({
            ...input,
            organizationId: requireOrganization(input.organizationId),
        })
        if (!entity) throw new NotFoundError('Cadastro nao encontrado')
        return toHrCatalogResponseDto(entity)
    }

    async updateCatalog(input: {
        type: HrCatalogType
        id: string
        organizationId: string | null
        name?: string
        description?: string | null
        status?: HrCatalogStatus
    }) {
        const organizationId = requireOrganization(input.organizationId)
        const current = await this.repository.findCatalogById({
            type: input.type,
            id: input.id,
            organizationId,
        })
        if (!current) throw new NotFoundError('Cadastro nao encontrado')
        if (
            input.name &&
            input.name.toLowerCase() !== current.name.toLowerCase()
        ) {
            const duplicate = await this.repository.findCatalogByName({
                type: input.type,
                organizationId,
                name: input.name,
            })
            if (duplicate) throw new ConflictError('Nome ja utilizado')
        }
        const updated = await this.repository.updateCatalog({
            type: input.type,
            id: input.id,
            organizationId,
            data: {
                name: input.name ?? current.name,
                description:
                    input.description === undefined
                        ? current.description
                        : input.description,
                status: input.status ?? current.status,
            },
        })
        if (!updated) throw new NotFoundError('Cadastro nao encontrado')
        return toHrCatalogResponseDto(updated)
    }

    async deleteCatalog(input: {
        type: HrCatalogType
        id: string
        organizationId: string | null
    }) {
        const organizationId = requireOrganization(input.organizationId)
        if (
            !(await this.repository.findCatalogById({
                type: input.type,
                id: input.id,
                organizationId,
            }))
        )
            throw new NotFoundError('Cadastro nao encontrado')
        if (
            await this.repository.catalogHasReferences({
                type: input.type,
                id: input.id,
                organizationId,
            })
        )
            throw new ConflictError('Cadastro possui vinculos ou historico')
        await this.repository.deleteCatalog({
            type: input.type,
            id: input.id,
            organizationId,
        })
    }

    private async activeCatalog(
        type: HrCatalogType,
        id: string,
        organizationId: string,
    ) {
        const entity = await this.repository.findCatalogById({
            type,
            id,
            organizationId,
        })
        if (!entity || entity.status !== 'ACTIVE')
            throw new BadRequestError(
                `${type === 'department' ? 'Departamento' : 'Cargo'} deve estar ativo`,
            )
        return entity
    }

    private async validateMember(
        organizationUserId: string | null,
        organizationId: string,
    ) {
        if (
            organizationUserId &&
            !(await this.repository.memberIsActive({
                id: organizationUserId,
                organizationId,
            }))
        )
            throw new BadRequestError(
                'Membro vinculado deve estar ativo na organizacao',
            )
    }

    private async ensureEmployeeUnique(input: {
        organizationId: string
        id?: string
        cpf: string
        registration: string
        organizationUserId: string | null
    }) {
        for (const [field, value] of [
            ['cpf', input.cpf],
            ['registration', input.registration],
            ['organization_user_id', input.organizationUserId],
        ] as const) {
            if (!value) continue
            const found = await this.repository.findEmployeeByUnique({
                organizationId: input.organizationId,
                field,
                value,
            })
            if (found && found.id !== input.id)
                throw new ConflictError(
                    field === 'cpf'
                        ? 'CPF ja utilizado'
                        : field === 'registration'
                          ? 'Matricula ja utilizada'
                          : 'Membro ja vinculado a outro funcionario',
                )
        }
    }

    async createEmployee(input: {
        organizationId: string | null
        createdBy: string
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
        currentPayAmount: string
        contractType: ContractType
        payFrequency: PayFrequency
        estimatedMonthlyUnits: string
        contractStartDate?: string
        contractEndDate: string | null
        notes: string | null
    }) {
        const organizationId = requireOrganization(input.organizationId)
        await this.activeCatalog(
            'department',
            input.departmentId,
            organizationId,
        )
        await this.activeCatalog('position', input.positionId, organizationId)
        await this.validateMember(input.organizationUserId, organizationId)
        await this.ensureEmployeeUnique({ ...input, organizationId })
        if (input.birthDate)
            ensureDateOrder(
                input.birthDate,
                input.hireDate,
                'Nascimento deve ser anterior a admissao',
            )
        if (input.contractStartDate && input.contractEndDate)
            ensureDateOrder(
                input.contractStartDate,
                input.contractEndDate,
                'Fim do contrato deve ser igual ou posterior ao inicio',
            )
        const data: EmployeeData = {
            organizationId,
            organizationUserId: input.organizationUserId,
            departmentId: input.departmentId,
            positionId: input.positionId,
            name: input.name,
            cpf: input.cpf,
            registration: input.registration,
            email: input.email,
            phone: input.phone,
            birthDate: input.birthDate,
            hireDate: input.hireDate,
            currentSalary: input.currentPayAmount,
            contractType: input.contractType,
            payFrequency: input.payFrequency,
            estimatedMonthlyUnits: input.estimatedMonthlyUnits,
            contractStartDate: input.contractStartDate ?? input.hireDate,
            contractEndDate: input.contractEndDate,
            status: 'ACTIVE',
            terminationDate: null,
            terminationReason: null,
            notes: input.notes,
        }
        return toEmployeeResponseDto(
            await this.repository.createEmployee({
                data,
                createdBy: input.createdBy,
            }),
        )
    }

    async listEmployees(
        input: Omit<EmployeeFilters, 'organizationId'> & {
            organizationId: string | null
            page: number
            pageSize: number
        },
    ) {
        const organizationId = requireOrganization(input.organizationId)
        const { page, pageSize, ...filters } = input
        const result = await this.repository.listEmployees(
            { ...filters, organizationId },
            { page, pageSize },
        )
        return {
            items: result.items.map(toEmployeeResponseDto),
            pagination: {
                page,
                pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / pageSize),
            },
        }
    }

    async getEmployee(input: { id: string; organizationId: string | null }) {
        const entity = await this.employeeOrThrow(input)
        return toEmployeeResponseDto(entity)
    }

    private async employeeOrThrow(input: {
        id: string
        organizationId: string | null
    }) {
        const entity = await this.repository.findEmployeeById({
            id: input.id,
            organizationId: requireOrganization(input.organizationId),
        })
        if (!entity) throw new NotFoundError('Funcionario nao encontrado')
        return entity
    }

    async updateEmployee(input: {
        id: string
        organizationId: string | null
        organizationUserId?: string | null
        name?: string
        cpf?: string
        registration?: string
        email?: string | null
        phone?: string | null
        birthDate?: string | null
        notes?: string | null
        status?: EmployeeStatus
        terminationDate?: string | null
        terminationReason?: string | null
    }) {
        const current = await this.employeeOrThrow(input)
        if (current.status === 'TERMINATED')
            throw new ConflictError(
                'Funcionario desligado nao pode ser alterado',
            )
        const organizationUserId =
            input.organizationUserId === undefined
                ? current.organizationUserId
                : input.organizationUserId
        await this.validateMember(organizationUserId, current.organizationId)
        await this.ensureEmployeeUnique({
            organizationId: current.organizationId,
            id: current.id,
            cpf: input.cpf ?? current.cpf,
            registration: input.registration ?? current.registration,
            organizationUserId,
        })
        const status = input.status ?? current.status
        const terminationDate =
            status === 'TERMINATED' ? (input.terminationDate ?? null) : null
        const terminationReason =
            status === 'TERMINATED' ? (input.terminationReason ?? null) : null
        if (status === 'TERMINATED') {
            if (!terminationDate)
                throw new BadRequestError('Data de desligamento e obrigatoria')
            ensureDateOrder(
                current.hireDate,
                terminationDate,
                'Desligamento deve ser igual ou posterior a admissao',
            )
        } else if (
            input.terminationDate !== undefined ||
            input.terminationReason !== undefined
        ) {
            throw new BadRequestError(
                'Dados de desligamento exigem status TERMINATED',
            )
        }
        const updated = await this.repository.updateEmployee({
            id: current.id,
            organizationId: current.organizationId,
            data: {
                organizationUserId,
                name: input.name ?? current.name,
                cpf: input.cpf ?? current.cpf,
                registration: input.registration ?? current.registration,
                email: input.email === undefined ? current.email : input.email,
                phone: input.phone === undefined ? current.phone : input.phone,
                birthDate:
                    input.birthDate === undefined
                        ? current.birthDate
                        : input.birthDate,
                hireDate: current.hireDate,
                status,
                terminationDate,
                terminationReason,
                notes: input.notes === undefined ? current.notes : input.notes,
            },
        })
        if (!updated) throw new NotFoundError('Funcionario nao encontrado')
        return toEmployeeResponseDto(updated)
    }

    async deleteEmployee(input: { id: string; organizationId: string | null }) {
        const employee = await this.employeeOrThrow(input)
        if (employee.status === 'TERMINATED')
            throw new ConflictError(
                'Funcionario desligado deve permanecer no historico',
            )
        if (
            await this.repository.employeeHasAdditionalHistory({
                id: employee.id,
                organizationId: employee.organizationId,
            })
        )
            throw new ConflictError('Funcionario possui alteracoes historicas')
        await this.repository.deleteEmployee({
            id: employee.id,
            organizationId: employee.organizationId,
        })
    }

    async createAssignment(input: {
        id: string
        organizationId: string | null
        departmentId: string
        positionId: string
        effectiveDate: string
        reason: string | null
        createdBy: string
    }) {
        const employee = await this.employeeOrThrow(input)
        if (employee.status === 'TERMINATED')
            throw new ConflictError(
                'Funcionario desligado nao pode ser alterado',
            )
        await this.activeCatalog(
            'department',
            input.departmentId,
            employee.organizationId,
        )
        await this.activeCatalog(
            'position',
            input.positionId,
            employee.organizationId,
        )
        const history = await this.repository.listAssignments({
            employeeId: employee.id,
            organizationId: employee.organizationId,
        })
        const latest = history[0]
        if (latest && input.effectiveDate <= latest.effectiveDate)
            throw new ConflictError(
                'Vigencia deve ser posterior ao ultimo historico funcional',
            )
        return toEmployeeAssignmentResponseDto(
            await this.repository.createAssignment({
                employeeId: employee.id,
                organizationId: employee.organizationId,
                departmentId: input.departmentId,
                positionId: input.positionId,
                effectiveDate: input.effectiveDate,
                reason: input.reason,
                createdBy: input.createdBy,
            }),
        )
    }

    async listAssignments(input: {
        id: string
        organizationId: string | null
    }) {
        const employee = await this.employeeOrThrow(input)
        return (
            await this.repository.listAssignments({
                employeeId: employee.id,
                organizationId: employee.organizationId,
            })
        ).map(toEmployeeAssignmentResponseDto)
    }

    async createSalaryChange(input: {
        id: string
        organizationId: string | null
        payAmount: string
        contractType: ContractType
        payFrequency: PayFrequency
        estimatedMonthlyUnits: string
        contractStartDate?: string
        contractEndDate: string | null
        effectiveDate: string
        reason: string | null
        createdBy: string
    }) {
        const employee = await this.employeeOrThrow(input)
        if (employee.status === 'TERMINATED')
            throw new ConflictError(
                'Funcionario desligado nao pode ser alterado',
            )
        const history = await this.repository.listSalaryChanges({
            employeeId: employee.id,
            organizationId: employee.organizationId,
        })
        const latest = history[0]
        if (latest && input.effectiveDate <= latest.effectiveDate)
            throw new ConflictError(
                'Vigencia deve ser posterior ao ultimo historico remuneratorio',
            )
        if (input.contractStartDate && input.contractEndDate)
            ensureDateOrder(
                input.contractStartDate,
                input.contractEndDate,
                'Fim do contrato deve ser igual ou posterior ao inicio',
            )
        return toSalaryChangeResponseDto(
            await this.repository.createSalaryChange({
                employeeId: employee.id,
                organizationId: employee.organizationId,
                payAmount: input.payAmount,
                contractType: input.contractType,
                payFrequency: input.payFrequency,
                estimatedMonthlyUnits: input.estimatedMonthlyUnits,
                contractStartDate:
                    input.contractStartDate ?? input.effectiveDate,
                contractEndDate: input.contractEndDate,
                effectiveDate: input.effectiveDate,
                reason: input.reason,
                createdBy: input.createdBy,
            }),
        )
    }

    async listSalaryChanges(input: {
        id: string
        organizationId: string | null
    }) {
        const employee = await this.employeeOrThrow(input)
        return (
            await this.repository.listSalaryChanges({
                employeeId: employee.id,
                organizationId: employee.organizationId,
            })
        ).map(toSalaryChangeResponseDto)
    }

    async getSummary(input: {
        organizationId: string | null
        year?: number
        month?: number
    }) {
        const now = new Date()
        const year = input.year ?? now.getUTCFullYear()
        const month = input.month ?? now.getUTCMonth() + 1
        const periodStart = `${year}-${String(month).padStart(2, '0')}-01`
        const periodEnd = new Date(Date.UTC(year, month, 0))
            .toISOString()
            .slice(0, 10)
        return this.repository.getSummary({
            organizationId: requireOrganization(input.organizationId),
            periodStart,
            periodEnd,
        })
    }

    async createPayrollProvision(input: {
        organizationId: string | null
        createdBy: string
        year: number
        month: number
        dueDate: string
        accountId: string
        categoryId: string
    }) {
        const organizationId = requireOrganization(input.organizationId)
        const existing = await this.repository.findPayrollProvisionByPeriod({
            organizationId,
            year: input.year,
            month: input.month,
        })
        if (existing)
            throw new ConflictError('Provisao da competencia ja existe')

        return toPayrollProvisionResponseDto(
            await this.payrollProvisionFinancialPort.createPayrollProvision({
                ...input,
                organizationId,
            }),
        )
    }
}
