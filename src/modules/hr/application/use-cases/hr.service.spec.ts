import {
    BadRequestError,
    ConflictError,
} from '../../../../shared/domain/errors'
import type {
    EmployeeAssignmentEntity,
    EmployeeEntity,
    HrCatalogEntity,
    PayrollProvisionEntity,
    SalaryChangeEntity,
} from '../../domain/entities/hr.entity'
import type { HrRepository } from '../../domain/repositories/hr.repository'
import type { PayrollProvisionFinancialPort } from '../ports/payroll-provision-financial.port'
import { HrService } from './hr.service'

const organizationId = '11111111-1111-4111-8111-111111111111'
const userId = '22222222-2222-4222-8222-222222222222'
const employeeId = '33333333-3333-4333-8333-333333333333'
const departmentId = '44444444-4444-4444-8444-444444444444'
const positionId = '55555555-5555-4555-8555-555555555555'
const now = new Date('2026-06-19T12:00:00.000Z')

const catalog = (
    id: string,
    name: string,
    organization = organizationId,
): HrCatalogEntity => ({
    id,
    organizationId: organization,
    name,
    description: null,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
})

const employee = (overrides: Partial<EmployeeEntity> = {}): EmployeeEntity => ({
    id: employeeId,
    organizationId,
    organizationUserId: null,
    memberName: null,
    memberEmail: null,
    departmentId,
    departmentName: 'Operacoes',
    positionId,
    positionName: 'Analista',
    name: 'Maria Silva',
    cpf: '12345678901',
    registration: 'EMP-001',
    email: 'maria@example.com',
    phone: null,
    birthDate: '1990-01-01',
    hireDate: '2026-01-10',
    currentSalary: '5000.00',
    contractType: 'CLT',
    payFrequency: 'MONTHLY',
    estimatedMonthlyUnits: '1.0000',
    contractStartDate: '2026-01-10',
    contractEndDate: null,
    status: 'ACTIVE',
    terminationDate: null,
    terminationReason: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
})

const assignment = (
    effectiveDate = '2026-01-10',
): EmployeeAssignmentEntity => ({
    id: '66666666-6666-4666-8666-666666666666',
    organizationId,
    employeeId,
    departmentId,
    departmentName: 'Operacoes',
    positionId,
    positionName: 'Analista',
    effectiveDate,
    reason: 'Admissao',
    createdBy: userId,
    creatorName: 'Admin',
    createdAt: now,
})

const salary = (effectiveDate = '2026-01-10'): SalaryChangeEntity => ({
    id: '77777777-7777-4777-8777-777777777777',
    organizationId,
    employeeId,
    payAmount: '5000.00',
    contractType: 'CLT',
    payFrequency: 'MONTHLY',
    estimatedMonthlyUnits: '1.0000',
    contractStartDate: '2026-01-10',
    contractEndDate: null,
    effectiveDate,
    reason: 'Admissao',
    createdBy: userId,
    creatorName: 'Admin',
    createdAt: now,
})

const payrollProvision = (): PayrollProvisionEntity => ({
    id: '88888888-8888-4888-8888-888888888888',
    organizationId,
    year: 2026,
    month: 6,
    amount: '5000.00',
    employeeCount: 1,
    financialPayableId: '99999999-9999-4999-8999-999999999999',
    createdAt: now,
})

function repositoryMock(): jest.Mocked<HrRepository> {
    return {
        createCatalog: jest.fn(),
        listCatalog: jest.fn(),
        findCatalogById: jest.fn(),
        findCatalogByName: jest.fn(),
        updateCatalog: jest.fn(),
        deleteCatalog: jest.fn(),
        catalogHasReferences: jest.fn(),
        createEmployee: jest.fn(),
        listEmployees: jest.fn(),
        findEmployeeById: jest.fn(),
        findEmployeeByUnique: jest.fn(),
        updateEmployee: jest.fn(),
        deleteEmployee: jest.fn(),
        employeeHasAdditionalHistory: jest.fn(),
        memberIsActive: jest.fn(),
        createAssignment: jest.fn(),
        listAssignments: jest.fn(),
        createSalaryChange: jest.fn(),
        listSalaryChanges: jest.fn(),
        getSummary: jest.fn(),
        findPayrollProvisionByPeriod: jest.fn(),
    }
}

function financialPortMock(): jest.Mocked<PayrollProvisionFinancialPort> {
    return {
        createPayrollProvision: jest.fn(),
    }
}

function makeService(
    repository: HrRepository,
    financialPort: PayrollProvisionFinancialPort = financialPortMock(),
) {
    return new HrService(repository, financialPort)
}

describe('HrService', () => {
    it('creates catalogs and blocks duplicate names per tenant', async () => {
        const repository = repositoryMock()
        const service = makeService(repository)
        repository.findCatalogByName.mockResolvedValueOnce(null)
        repository.createCatalog.mockResolvedValue(
            catalog(departmentId, 'Operacoes'),
        )

        await expect(
            service.createCatalog({
                type: 'department',
                organizationId,
                name: 'Operacoes',
                description: null,
                status: 'ACTIVE',
            }),
        ).resolves.toMatchObject({ id: departmentId, name: 'Operacoes' })

        repository.findCatalogByName.mockResolvedValueOnce(
            catalog(departmentId, 'Operacoes'),
        )
        await expect(
            service.createCatalog({
                type: 'department',
                organizationId,
                name: 'Operacoes',
                description: null,
                status: 'ACTIVE',
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('blocks catalog deletion when references exist', async () => {
        const repository = repositoryMock()
        repository.findCatalogById.mockResolvedValue(
            catalog(departmentId, 'Operacoes'),
        )
        repository.catalogHasReferences.mockResolvedValue(true)
        const service = makeService(repository)

        await expect(
            service.deleteCatalog({
                type: 'department',
                id: departmentId,
                organizationId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('creates an employee after validating catalogs and active member', async () => {
        const repository = repositoryMock()
        repository.findCatalogById
            .mockResolvedValueOnce(catalog(departmentId, 'Operacoes'))
            .mockResolvedValueOnce(catalog(positionId, 'Analista'))
        repository.memberIsActive.mockResolvedValue(true)
        repository.findEmployeeByUnique.mockResolvedValue(null)
        repository.createEmployee.mockResolvedValue(
            employee({ organizationUserId: userId }),
        )
        const service = makeService(repository)

        const result = await service.createEmployee({
            organizationId,
            createdBy: userId,
            organizationUserId: userId,
            departmentId,
            positionId,
            name: 'Maria Silva',
            cpf: '12345678901',
            registration: 'EMP-001',
            email: 'maria@example.com',
            phone: null,
            birthDate: '1990-01-01',
            hireDate: '2026-01-10',
            currentPayAmount: '5000.00',
            contractType: 'CLT',
            payFrequency: 'MONTHLY',
            estimatedMonthlyUnits: '1.0000',
            contractStartDate: '2026-01-10',
            contractEndDate: null,
            notes: null,
        })

        expect(repository.createEmployee).toHaveBeenCalledWith(
            expect.objectContaining({
                createdBy: userId,
                data: expect.objectContaining({
                    currentSalary: '5000.00',
                    contractType: 'CLT',
                    payFrequency: 'MONTHLY',
                    estimatedMonthlyUnits: '1.0000',
                    contractStartDate: '2026-01-10',
                    contractEndDate: null,
                    status: 'ACTIVE',
                }),
            }),
        )
        expect(result).not.toHaveProperty('currentSalary')
    })

    it('rejects inactive member links and invalid admission dates', async () => {
        const repository = repositoryMock()
        repository.findCatalogById
            .mockResolvedValueOnce(catalog(departmentId, 'Operacoes'))
            .mockResolvedValueOnce(catalog(positionId, 'Analista'))
        repository.memberIsActive.mockResolvedValue(false)
        const service = makeService(repository)

        await expect(
            service.createEmployee({
                organizationId,
                createdBy: userId,
                organizationUserId: userId,
                departmentId,
                positionId,
                name: 'Maria',
                cpf: '12345678901',
                registration: 'EMP-001',
                email: null,
                phone: null,
                birthDate: '1990-01-01',
                hireDate: '2026-01-10',
                currentPayAmount: '5000.00',
                contractType: 'CLT',
                payFrequency: 'MONTHLY',
                estimatedMonthlyUnits: '1.0000',
                contractStartDate: '2026-01-10',
                contractEndDate: null,
                notes: null,
            }),
        ).rejects.toBeInstanceOf(BadRequestError)
    })

    it('terminates with date and makes termination terminal', async () => {
        const repository = repositoryMock()
        repository.findEmployeeById.mockResolvedValueOnce(employee())
        repository.findEmployeeByUnique.mockResolvedValue(null)
        repository.updateEmployee.mockResolvedValue(
            employee({
                status: 'TERMINATED',
                terminationDate: '2026-06-19',
            }),
        )
        const service = makeService(repository)

        await expect(
            service.updateEmployee({
                id: employeeId,
                organizationId,
                status: 'TERMINATED',
                terminationDate: '2026-06-19',
                terminationReason: 'Pedido',
            }),
        ).resolves.toMatchObject({
            status: 'TERMINATED',
            terminationDate: '2026-06-19',
        })

        repository.findEmployeeById.mockResolvedValueOnce(
            employee({ status: 'TERMINATED' }),
        )
        await expect(
            service.updateEmployee({
                id: employeeId,
                organizationId,
                name: 'Outro nome',
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('requires termination fields to match status', async () => {
        const repository = repositoryMock()
        repository.findEmployeeById.mockResolvedValue(employee())
        repository.findEmployeeByUnique.mockResolvedValue(null)
        const service = makeService(repository)

        await expect(
            service.updateEmployee({
                id: employeeId,
                organizationId,
                status: 'TERMINATED',
            }),
        ).rejects.toBeInstanceOf(BadRequestError)

        await expect(
            service.updateEmployee({
                id: employeeId,
                organizationId,
                status: 'ON_LEAVE',
                terminationReason: 'Nao aplicavel',
            }),
        ).rejects.toBeInstanceOf(BadRequestError)
    })

    it('records only forward-dated functional changes', async () => {
        const repository = repositoryMock()
        repository.findEmployeeById.mockResolvedValue(employee())
        repository.findCatalogById
            .mockResolvedValueOnce(catalog(departmentId, 'Operacoes'))
            .mockResolvedValueOnce(catalog(positionId, 'Analista'))
        repository.listAssignments.mockResolvedValue([assignment('2026-05-01')])
        const service = makeService(repository)

        await expect(
            service.createAssignment({
                id: employeeId,
                organizationId,
                departmentId,
                positionId,
                effectiveDate: '2026-04-01',
                reason: null,
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('records remuneration changes without exposing them in employee responses', async () => {
        const repository = repositoryMock()
        repository.findEmployeeById.mockResolvedValue(employee())
        repository.listSalaryChanges.mockResolvedValue([salary('2026-01-10')])
        repository.createSalaryChange.mockResolvedValue(salary('2026-06-01'))
        const service = makeService(repository)

        await expect(
            service.createSalaryChange({
                id: employeeId,
                organizationId,
                payAmount: '6000.00',
                contractType: 'TEMPORARY',
                payFrequency: 'WEEKLY',
                estimatedMonthlyUnits: '4.3333',
                contractStartDate: '2026-06-01',
                contractEndDate: '2026-12-31',
                effectiveDate: '2026-06-01',
                reason: 'Merito',
                createdBy: userId,
            }),
        ).resolves.toMatchObject({ effectiveDate: '2026-06-01' })
    })

    it('restricts soft deletion to employees without additional history', async () => {
        const repository = repositoryMock()
        repository.findEmployeeById.mockResolvedValue(employee())
        repository.employeeHasAdditionalHistory.mockResolvedValue(true)
        const service = makeService(repository)

        await expect(
            service.deleteEmployee({ id: employeeId, organizationId }),
        ).rejects.toBeInstanceOf(ConflictError)
        expect(repository.deleteEmployee).not.toHaveBeenCalled()
    })

    it('creates a monthly payroll provision and blocks duplicate periods', async () => {
        const repository = repositoryMock()
        const financialPort = financialPortMock()
        repository.findPayrollProvisionByPeriod.mockResolvedValueOnce(null)
        financialPort.createPayrollProvision.mockResolvedValue(
            payrollProvision(),
        )
        const service = makeService(repository, financialPort)

        await expect(
            service.createPayrollProvision({
                organizationId,
                createdBy: userId,
                year: 2026,
                month: 6,
                dueDate: '2026-06-30',
                accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            }),
        ).resolves.toMatchObject({
            year: 2026,
            month: 6,
            amount: '5000.00',
            employeeCount: 1,
        })
        expect(financialPort.createPayrollProvision).toHaveBeenCalledWith({
            organizationId,
            createdBy: userId,
            year: 2026,
            month: 6,
            dueDate: '2026-06-30',
            accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        })

        repository.findPayrollProvisionByPeriod.mockResolvedValueOnce(
            payrollProvision(),
        )
        await expect(
            service.createPayrollProvision({
                organizationId,
                createdBy: userId,
                year: 2026,
                month: 6,
                dueDate: '2026-06-30',
                accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            }),
        ).rejects.toBeInstanceOf(ConflictError)
        expect(financialPort.createPayrollProvision).toHaveBeenCalledTimes(1)
    })

    it('propagates payroll provision financial validation errors', async () => {
        const repository = repositoryMock()
        const financialPort = financialPortMock()
        const service = makeService(repository, financialPort)
        repository.findPayrollProvisionByPeriod.mockResolvedValue(null)

        for (const error of [
            new BadRequestError('Conta financeira invalida'),
            new BadRequestError('Categoria financeira invalida'),
            new BadRequestError('Nao ha colaboradores ativos para provisionar'),
            new ConflictError('Provisao da competencia ja existe'),
        ]) {
            financialPort.createPayrollProvision.mockRejectedValueOnce(error)

            await expect(
                service.createPayrollProvision({
                    organizationId,
                    createdBy: userId,
                    year: 2026,
                    month: 6,
                    dueDate: '2026-06-30',
                    accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                }),
            ).rejects.toBe(error)
        }
    })

    it('uses current month by default in the summary', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2026-06-19T12:00:00Z'))
        const repository = repositoryMock()
        repository.getSummary.mockResolvedValue({
            totalEmployees: 1,
            byStatus: [{ status: 'ACTIVE', total: 1 }],
            byDepartment: [],
            byPosition: [],
            admissions: 1,
            terminations: 0,
            periodStart: '2026-06-01',
            periodEnd: '2026-06-30',
        })
        const service = makeService(repository)

        await service.getSummary({ organizationId })
        expect(repository.getSummary).toHaveBeenCalledWith({
            organizationId,
            periodStart: '2026-06-01',
            periodEnd: '2026-06-30',
        })
        jest.useRealTimers()
    })
})
