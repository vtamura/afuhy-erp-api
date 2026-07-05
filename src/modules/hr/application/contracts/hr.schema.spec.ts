import {
    createCompensationPreviewSchema,
    createEmployeeSchema,
    createSalaryChangeSchema,
} from './hr.schema'

const authUser = {
    userId: '22222222-2222-4222-8222-222222222222',
    sessionId: '33333333-3333-4333-8333-333333333333',
    organizationId: '11111111-1111-4111-8111-111111111111',
}

const employeePayload = {
    authUser,
    organizationUserId: null,
    departmentId: '44444444-4444-4444-8444-444444444444',
    positionId: '55555555-5555-4555-8555-555555555555',
    name: 'Maria Silva',
    cpf: '123.456.789-01',
    registration: 'EMP-001',
    email: null,
    phone: null,
    birthDate: '1990-01-01',
    hireDate: '2026-01-10',
    currentPayAmount: '5000',
    notes: null,
}

describe('hr contract schemas', () => {
    it('normalizes monthly CLT employees with estimated units equal to one', () => {
        const result = createEmployeeSchema.parse({
            ...employeePayload,
            contractType: 'CLT',
            payFrequency: 'MONTHLY',
        })

        expect(result).toMatchObject({
            cpf: '12345678901',
            currentPayAmount: '5000.00',
            estimatedMonthlyUnits: '1.0000',
            contractEndDate: null,
        })
    })

    it('requires an end date for temporary contracts and defaults weekly units', () => {
        expect(() =>
            createEmployeeSchema.parse({
                ...employeePayload,
                contractType: 'TEMPORARY',
                payFrequency: 'WEEKLY',
            }),
        ).toThrow('Contrato temporario exige data final')

        expect(
            createEmployeeSchema.parse({
                ...employeePayload,
                contractType: 'TEMPORARY',
                payFrequency: 'WEEKLY',
                contractEndDate: '2026-12-31',
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '4.3333',
            contractEndDate: '2026-12-31',
        })
    })

    it('requires estimated monthly units for daily and hourly remuneration', () => {
        expect(() =>
            createEmployeeSchema.parse({
                ...employeePayload,
                contractType: 'PJ',
                payFrequency: 'DAILY',
            }),
        ).toThrow('Informe a carga estimada em dias por mes ou dias por semana')

        expect(
            createSalaryChangeSchema.parse({
                authUser,
                id: '66666666-6666-4666-8666-666666666666',
                payAmount: '100',
                contractType: 'FREELANCER',
                payFrequency: 'HOURLY',
                estimatedMonthlyUnits: 120,
                effectiveDate: '2026-06-01',
                reason: null,
            }),
        ).toMatchObject({
            payAmount: '100.00',
            estimatedMonthlyUnits: '120.0000',
            contractEndDate: null,
        })
    })

    it('does not allow CLT contract end dates in the MVP', () => {
        expect(() =>
            createEmployeeSchema.parse({
                ...employeePayload,
                contractType: 'CLT',
                payFrequency: 'MONTHLY',
                contractEndDate: '2026-12-31',
            }),
        ).toThrow('Contrato CLT nao deve ter data final no MVP')
    })

    it('calculates estimated units from friendly workload and prefers it over technical units', () => {
        expect(
            createEmployeeSchema.parse({
                ...employeePayload,
                contractType: 'PJ',
                payFrequency: 'DAILY',
                estimatedMonthlyUnits: '10.0000',
                estimatedWorkload: {
                    unit: 'DAYS_PER_MONTH',
                    amount: 22,
                },
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '22.0000',
        })

        expect(
            createSalaryChangeSchema.parse({
                authUser,
                id: '66666666-6666-4666-8666-666666666666',
                payAmount: '50',
                contractType: 'FREELANCER',
                payFrequency: 'HOURLY',
                estimatedWorkload: {
                    unit: 'HOURS_PER_WEEK',
                    amount: 40,
                },
                effectiveDate: '2026-06-01',
                reason: null,
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '173.3320',
        })
    })

    it('validates compensation preview payloads', () => {
        expect(
            createCompensationPreviewSchema.parse({
                authUser,
                payAmount: '50',
                contractType: 'FREELANCER',
                payFrequency: 'HOURLY',
                estimatedWorkload: {
                    unit: 'HOURS_PER_WEEK',
                    amount: 40,
                },
            }),
        ).toMatchObject({
            payAmount: '50.00',
            estimatedMonthlyUnits: '173.3320',
        })

        expect(() =>
            createCompensationPreviewSchema.parse({
                authUser,
                payAmount: '50',
                contractType: 'FREELANCER',
                payFrequency: 'HOURLY',
                estimatedWorkload: {
                    unit: 'DAYS_PER_MONTH',
                    amount: 22,
                },
            }),
        ).toThrow('Carga estimada DAYS_PER_MONTH nao e compativel')
    })
})
