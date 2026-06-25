import type {
    ReportsFinancialEntity,
    ReportsHrEntity,
    ReportsInventoryEntity,
    ReportsLoansEntity,
    ReportsTasksEntity,
} from '../entities/report.entity'

export type ReportsDashboardQuery = {
    organizationId: string
    periodStart: string
    periodEnd: string
    seriesStart: string
    today: string
}

export interface ReportsRepository {
    getFinancial(query: ReportsDashboardQuery): Promise<ReportsFinancialEntity>
    getInventory(query: ReportsDashboardQuery): Promise<ReportsInventoryEntity>
    getHr(query: ReportsDashboardQuery): Promise<ReportsHrEntity>
    getLoans(query: ReportsDashboardQuery): Promise<ReportsLoansEntity>
    getTasks(query: ReportsDashboardQuery): Promise<ReportsTasksEntity>
}
