import type {
    ReportsFinancialEntity,
    ReportsHrEntity,
    ReportsInventoryEntity,
    ReportsLoansEntity,
    ReportsTasksEntity,
} from '../../domain/entities/report.entity'
import type {
    ReportsDashboardQuery,
    ReportsRepository,
} from '../../domain/repositories/report.repository'
import {
    ReportsDashboardService,
    type ReportsClock,
} from './reports-dashboard.service'

const organizationId = '11111111-1111-4111-8111-111111111111'

const emptyFinancial: ReportsFinancialEntity = {
    balances: { current: '0.00', projected: '0.00' },
    cashFlow: {
        paidIncome: '0.00',
        paidExpense: '0.00',
        pendingIncome: '0.00',
        pendingExpense: '0.00',
        result: '0.00',
    },
    monthlyFlow: [],
    overdue: { count: 0, income: '0.00', expense: '0.00', items: [] },
}

const emptyInventory: ReportsInventoryEntity = {
    activeProducts: 0,
    activeSkus: 0,
    totalQuantity: '0.000',
    totalValue: '0.00',
    zeroStockCount: 0,
    lowStockCount: 0,
    lowStockItems: [],
}

const emptyHr: ReportsHrEntity = {
    totalEmployees: 0,
    byStatus: [],
    admissions: 0,
    terminations: 0,
}

const emptyLoans: ReportsLoansEntity = {
    openLoans: 0,
    overdueLoans: 0,
    completedLoans: 0,
    pendingItemsQuantity: '0.000',
    occurrences: { lost: 0, damaged: 0 },
    pendingCharges: { count: 0, amount: '0.00' },
    overdueItems: [],
}

const emptyTasks: ReportsTasksEntity = {
    openTasks: 0,
    overdueTasks: 0,
    urgentTasks: 0,
    completedTasks: 0,
    priorityBreakdown: [],
    attentionItems: [],
}

class FakeReportsRepository implements ReportsRepository {
    queries: ReportsDashboardQuery[] = []
    financialData = emptyFinancial
    inventoryData = emptyInventory
    hrData = emptyHr
    loansData = emptyLoans
    tasksData = emptyTasks

    async getFinancial(query: ReportsDashboardQuery) {
        this.queries.push(query)
        return this.financialData
    }
    async getInventory(query: ReportsDashboardQuery) {
        this.queries.push(query)
        return this.inventoryData
    }
    async getHr(query: ReportsDashboardQuery) {
        this.queries.push(query)
        return this.hrData
    }
    async getLoans(query: ReportsDashboardQuery) {
        this.queries.push(query)
        return this.loansData
    }
    async getTasks(query: ReportsDashboardQuery) {
        this.queries.push(query)
        return this.tasksData
    }
}

const clock = (date: string): ReportsClock => ({
    now: () => new Date(date),
})

describe('ReportsDashboardService', () => {
    it('usa o mes atual no timezone America/Sao_Paulo por padrao', async () => {
        const repository = new FakeReportsRepository()
        const service = new ReportsDashboardService(
            repository,
            clock('2026-06-24T12:00:00.000Z'),
        )

        const result = await service.financial({ organizationId })

        expect(result.period).toEqual({
            year: 2026,
            month: 6,
            startDate: '2026-06-01',
            endDate: '2026-06-30',
        })
        expect(repository.queries[0]).toMatchObject({
            periodStart: '2026-06-01',
            periodEnd: '2026-06-30',
            seriesStart: '2025-07-01',
            today: '2026-06-24',
        })
    })

    it('usa year/month informados quando presentes', async () => {
        const repository = new FakeReportsRepository()
        const service = new ReportsDashboardService(
            repository,
            clock('2026-06-24T12:00:00.000Z'),
        )

        const result = await service.tasks({
            organizationId,
            year: 2026,
            month: 2,
        })

        expect(result.period).toEqual({
            year: 2026,
            month: 2,
            startDate: '2026-02-01',
            endDate: '2026-02-28',
        })
    })

    it('combina todos os blocos no overview', async () => {
        const repository = new FakeReportsRepository()
        repository.inventoryData = {
            ...emptyInventory,
            lowStockCount: 2,
            lowStockItems: [
                {
                    productId: 'p1',
                    productName: 'Produto',
                    variantId: 'v1',
                    variantName: 'Variante',
                    sku: 'SKU',
                    currentQuantity: '1.000',
                    minimumQuantity: '3.000',
                },
            ],
        }
        repository.loansData = { ...emptyLoans, overdueLoans: 1 }
        repository.tasksData = { ...emptyTasks, urgentTasks: 1 }
        const service = new ReportsDashboardService(
            repository,
            clock('2026-06-24T12:00:00.000Z'),
        )

        const result = await service.overview({ organizationId })

        expect(result.financial).toBe(repository.financialData)
        expect(result.inventory.lowStockCount).toBe(2)
        expect(result.attention.inventoryLowStock.severity).toBe('MEDIUM')
        expect(result.attention.loansOverdue.count).toBe(1)
        expect(result.attention.tasksUrgentOrOverdue.count).toBe(1)
    })

    it('retorna zeros e listas vazias quando nao ha dados', async () => {
        const repository = new FakeReportsRepository()
        const service = new ReportsDashboardService(
            repository,
            clock('2026-06-24T12:00:00.000Z'),
        )

        const result = await service.overview({ organizationId })

        expect(result.financial.balances.current).toBe('0.00')
        expect(result.inventory.lowStockItems).toEqual([])
        expect(result.hr.byStatus).toEqual([])
        expect(result.loans.overdueItems).toEqual([])
        expect(result.tasks.attentionItems).toEqual([])
        expect(result.attention.financialOverdue.severity).toBe('LOW')
    })
})
