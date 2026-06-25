import { ReportsDashboardService } from '../../application/use-cases'
import {
    GetReportsFinancialController,
    GetReportsHrController,
    GetReportsInventoryController,
    GetReportsLoansController,
    GetReportsOverviewController,
    GetReportsTasksController,
} from '../../presentation/http/controllers'
import { createReportsRouter } from '../../presentation/http/routes'
import type { ReportsHttpRouterFactoryDependencies } from './reports-http-router-factory.types'

export function createReportsHttpRouterFactory(
    deps: ReportsHttpRouterFactoryDependencies,
) {
    const service = new ReportsDashboardService(deps.reportsRepository)
    return createReportsRouter({
        controllers: {
            overview: new GetReportsOverviewController(service),
            financial: new GetReportsFinancialController(service),
            inventory: new GetReportsInventoryController(service),
            hr: new GetReportsHrController(service),
            loans: new GetReportsLoansController(service),
            tasks: new GetReportsTasksController(service),
        },
        ...deps.middlewares,
    })
}
