import {
    BadRequestError,
    ConflictError,
} from '../../../../shared/domain/errors'
import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { PostgresPayrollProvisionFinancialPort } from './postgres-payroll-provision-financial.port'

const now = new Date('2026-06-19T12:00:00.000Z')
const input = {
    organizationId: '11111111-1111-4111-8111-111111111111',
    createdBy: '22222222-2222-4222-8222-222222222222',
    year: 2026,
    month: 6,
    dueDate: '2026-06-30',
    accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    categoryId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
}

function databaseClientMock(): jest.Mocked<DatabaseClient> {
    const client = {
        query: jest.fn(),
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        transaction: jest.fn((callback) => callback(client)),
    }

    return client as unknown as jest.Mocked<DatabaseClient>
}

describe('PostgresPayrollProvisionFinancialPort', () => {
    it('creates a pending financial payable and payroll provision atomically', async () => {
        const databaseClient = databaseClientMock()
        databaseClient.select
            .mockResolvedValueOnce([{ found: true }])
            .mockResolvedValueOnce([{ found: true }])
            .mockResolvedValueOnce([
                {
                    amount: '5000.00',
                    employee_count: '1',
                },
            ])
        databaseClient.query
            .mockResolvedValueOnce([
                { id: '99999999-9999-4999-8999-999999999999' },
            ])
            .mockResolvedValueOnce([
                {
                    id: '88888888-8888-4888-8888-888888888888',
                    organization_id: input.organizationId,
                    year: input.year,
                    month: input.month,
                    amount: '5000.00',
                    employee_count: 1,
                    financial_payable_id:
                        '99999999-9999-4999-8999-999999999999',
                    created_at: now,
                },
            ])
        const port = new PostgresPayrollProvisionFinancialPort(databaseClient)

        await expect(port.createPayrollProvision(input)).resolves.toMatchObject(
            {
                organizationId: input.organizationId,
                year: 2026,
                month: 6,
                amount: '5000.00',
                employeeCount: 1,
                financialPayableId: '99999999-9999-4999-8999-999999999999',
            },
        )
        expect(databaseClient.transaction).toHaveBeenCalledTimes(1)
        expect(databaseClient.query).toHaveBeenCalledTimes(2)
        expect(databaseClient.query.mock.calls[0][1]).toMatchObject({
            amount: '5000.00',
            transactionDate: '2026-06-01',
            description: 'Provisao de folha - 06/2026',
        })
    })

    it('rejects invalid financial references and empty payroll', async () => {
        const cases = [
            {
                selects: [[{ found: false }]],
                error: BadRequestError,
                message: 'Conta financeira invalida',
            },
            {
                selects: [[{ found: true }], [{ found: false }]],
                error: BadRequestError,
                message: 'Categoria financeira invalida',
            },
            {
                selects: [
                    [{ found: true }],
                    [{ found: true }],
                    [{ amount: '0', employee_count: '0' }],
                ],
                error: BadRequestError,
                message: 'Nao ha colaboradores ativos para provisionar',
            },
        ]

        for (const current of cases) {
            const databaseClient = databaseClientMock()
            for (const selectResult of current.selects) {
                databaseClient.select.mockResolvedValueOnce(selectResult)
            }
            const port = new PostgresPayrollProvisionFinancialPort(
                databaseClient,
            )

            try {
                await port.createPayrollProvision(input)
                throw new Error('Expected payroll provision creation to fail')
            } catch (error) {
                expect(error).toBeInstanceOf(current.error)
                expect(error).toMatchObject({ message: current.message })
            }
        }
    })

    it('converts concurrent period unique violation to conflict', async () => {
        const databaseClient = databaseClientMock()
        databaseClient.select
            .mockResolvedValueOnce([{ found: true }])
            .mockResolvedValueOnce([{ found: true }])
            .mockResolvedValueOnce([
                {
                    amount: '5000.00',
                    employee_count: '1',
                },
            ])
        databaseClient.query
            .mockResolvedValueOnce([
                { id: '99999999-9999-4999-8999-999999999999' },
            ])
            .mockRejectedValueOnce(
                Object.assign(new Error('duplicate'), {
                    parent: {
                        code: '23505',
                        constraint: 'hr_payroll_provisions_period_unique',
                    },
                }),
            )
        const port = new PostgresPayrollProvisionFinancialPort(databaseClient)

        try {
            await port.createPayrollProvision(input)
            throw new Error('Expected payroll provision creation to fail')
        } catch (error) {
            expect(error).toBeInstanceOf(ConflictError)
            expect(error).toMatchObject({
                message: 'Provisao da competencia ja existe',
            })
        }
        expect(databaseClient.query).toHaveBeenCalledTimes(2)
    })
})
