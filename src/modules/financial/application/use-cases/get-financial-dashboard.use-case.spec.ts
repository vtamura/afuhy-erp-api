import { ForbiddenError } from '../../../../shared/domain/errors'
import type { FinancialClock } from '../ports/financial-clock.port'
import type {
    FinancialAccountEntity,
    FinancialTransactionEntity,
} from '../../domain/entities/financial.entity'
import type {
    FinancialDashboardData,
    FinancialDashboardQuery,
    FinancialDashboardRepository,
} from '../../domain/repositories/financial-dashboard.repository'
import { GetFinancialDashboardUseCase } from './get-financial-dashboard.use-case'

const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'

class FixedClock implements FinancialClock {
    constructor(private readonly value: Date) {}

    now(): Date {
        return this.value
    }
}

class FakeDashboardRepository implements FinancialDashboardRepository {
    query: FinancialDashboardQuery | null = null

    constructor(private readonly data: FinancialDashboardData) {}

    async getDashboard(query: FinancialDashboardQuery) {
        this.query = query
        return this.data
    }
}

function account(
    id: string,
    currentBalance: string,
    projectedBalance: string,
    status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE',
): FinancialAccountEntity {
    const now = new Date('2026-06-01T12:00:00.000Z')
    return {
        id,
        organizationId,
        name: `Conta ${id}`,
        type: 'BANK',
        initialBalance: '0.00',
        currentBalance,
        projectedBalance,
        status,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    }
}

function transaction(id: string, dueDate: string): FinancialTransactionEntity {
    const now = new Date('2026-06-01T12:00:00.000Z')
    return {
        id,
        organizationId,
        accountId: 'account-1',
        categoryId: 'category-1',
        customerId: null,
        supplierId: null,
        description: `Lancamento ${id}`,
        notes: null,
        type: 'EXPENSE',
        amount: '25.00',
        transactionDate: '2026-06-01',
        dueDate,
        status: 'PENDING',
        paidAt: null,
        canceledAt: null,
        createdBy: '3ccbcefd-b996-4362-94bb-46955de8813e',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    }
}

function dashboardData(): FinancialDashboardData {
    return {
        accounts: [
            account('account-1', '150.00', '175.00'),
            account('account-2', '-20.00', '-30.00', 'INACTIVE'),
        ],
        cashFlow: {
            paidIncome: '500.00',
            paidExpense: '125.50',
            pendingIncome: '80.00',
            pendingExpense: '45.00',
        },
        monthlyFlow: [
            {
                year: 2026,
                month: 5,
                income: '100.00',
                expense: '40.00',
                result: '60.00',
            },
            {
                year: 2026,
                month: 6,
                income: '500.00',
                expense: '125.50',
                result: '374.50',
            },
        ],
        incomeCategories: [
            {
                categoryId: 'income-category',
                name: 'Vendas',
                type: 'INCOME',
                amount: '500.00',
                percentage: '100.00',
            },
        ],
        expenseCategories: [
            {
                categoryId: 'expense-category',
                name: 'Aluguel',
                type: 'EXPENSE',
                amount: '125.50',
                percentage: '100.00',
            },
        ],
        overdue: {
            count: 2,
            income: '0.00',
            expense: '50.00',
            items: [transaction('overdue-1', '2026-06-29')],
        },
        upcoming: {
            count: 1,
            income: '0.00',
            expense: '25.00',
            items: [transaction('upcoming-1', '2026-07-02')],
        },
    }
}

describe('GetFinancialDashboardUseCase', () => {
    it('uses the current month and today in Sao Paulo', async () => {
        const repository = new FakeDashboardRepository(dashboardData())
        const useCase = new GetFinancialDashboardUseCase(
            repository,
            new FixedClock(new Date('2026-07-01T02:30:00.000Z')),
        )

        const result = await useCase.execute({ organizationId })

        expect(result.period).toEqual({
            year: 2026,
            month: 6,
            startDate: '2026-06-01',
            endDate: '2026-06-30',
        })
        expect(repository.query).toMatchObject({
            organizationId,
            periodStart: '2026-06-01',
            periodEnd: '2026-06-30',
            seriesStart: '2025-07-01',
            today: '2026-06-30',
            upcomingEnd: '2026-07-07',
        })
    })

    it('accepts a selected leap-year month', async () => {
        const repository = new FakeDashboardRepository(dashboardData())
        const useCase = new GetFinancialDashboardUseCase(
            repository,
            new FixedClock(new Date('2026-06-18T12:00:00.000Z')),
        )

        const result = await useCase.execute({
            organizationId,
            year: 2028,
            month: 2,
        })

        expect(result.period).toMatchObject({
            startDate: '2028-02-01',
            endDate: '2028-02-29',
        })
        expect(repository.query?.seriesStart).toBe('2027-03-01')
    })

    it('calculates balances and monthly cash flow result', async () => {
        const useCase = new GetFinancialDashboardUseCase(
            new FakeDashboardRepository(dashboardData()),
            new FixedClock(new Date('2026-06-18T12:00:00.000Z')),
        )

        const result = await useCase.execute({ organizationId })

        expect(result.balances).toEqual({
            current: '130.00',
            projected: '145.00',
        })
        expect(result.cashFlow.result).toBe('374.50')
        expect(result.accounts[1].status).toBe('INACTIVE')
    })

    it('fills the twelve-month series with zero values', async () => {
        const useCase = new GetFinancialDashboardUseCase(
            new FakeDashboardRepository(dashboardData()),
            new FixedClock(new Date('2026-06-18T12:00:00.000Z')),
        )

        const result = await useCase.execute({ organizationId })

        expect(result.monthlyFlow).toHaveLength(12)
        expect(result.monthlyFlow[0]).toEqual({
            year: 2025,
            month: 7,
            income: '0.00',
            expense: '0.00',
            result: '0.00',
        })
        expect(result.monthlyFlow.at(-2)?.result).toBe('60.00')
        expect(result.monthlyFlow.at(-1)?.result).toBe('374.50')
    })

    it('maps category rankings and due transaction groups', async () => {
        const useCase = new GetFinancialDashboardUseCase(
            new FakeDashboardRepository(dashboardData()),
            new FixedClock(new Date('2026-06-18T12:00:00.000Z')),
        )

        const result = await useCase.execute({ organizationId })

        expect(result.categories.income[0]).toEqual({
            categoryId: 'income-category',
            name: 'Vendas',
            amount: '500.00',
            percentage: '100.00',
        })
        expect(result.overdue).toMatchObject({
            count: 2,
            expense: '50.00',
        })
        expect(result.overdue.items[0].createdAt).toBe(
            '2026-06-01T12:00:00.000Z',
        )
    })

    it('requires a selected organization', async () => {
        const useCase = new GetFinancialDashboardUseCase(
            new FakeDashboardRepository(dashboardData()),
            new FixedClock(new Date()),
        )

        await expect(
            useCase.execute({ organizationId: null }),
        ).rejects.toBeInstanceOf(ForbiddenError)
    })
})
