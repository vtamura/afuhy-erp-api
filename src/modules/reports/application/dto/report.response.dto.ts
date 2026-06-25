import type {
    ReportsFinancialEntity,
    ReportsHrEntity,
    ReportsInventoryEntity,
    ReportsLoansEntity,
    ReportsOverviewEntity,
    ReportsTasksEntity,
} from '../../domain/entities/report.entity'

export type ReportsOverviewResponseDto = ReportsOverviewEntity
export type ReportsFinancialResponseDto = {
    period: ReportsOverviewEntity['period']
    financial: ReportsFinancialEntity
}
export type ReportsInventoryResponseDto = {
    period: ReportsOverviewEntity['period']
    inventory: ReportsInventoryEntity
}
export type ReportsHrResponseDto = {
    period: ReportsOverviewEntity['period']
    hr: ReportsHrEntity
}
export type ReportsLoansResponseDto = {
    period: ReportsOverviewEntity['period']
    loans: ReportsLoansEntity
}
export type ReportsTasksResponseDto = {
    period: ReportsOverviewEntity['period']
    tasks: ReportsTasksEntity
}
