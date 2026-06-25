import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    GetReportsFinancialController,
    GetReportsHrController,
    GetReportsInventoryController,
    GetReportsLoansController,
    GetReportsOverviewController,
    GetReportsTasksController,
} from '../controllers'

export function createReportsRouter(params: {
    controllers: {
        overview: GetReportsOverviewController
        financial: GetReportsFinancialController
        inventory: GetReportsInventoryController
        hr: GetReportsHrController
        loans: GetReportsLoansController
        tasks: GetReportsTasksController
    }
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): Router {
    const router = Router()
    const auth = params.authenticateAccessTokenMiddleware
    const feature = params.authorizeFeatureMiddleware('reports.basic')
    const read = params.authorizePermissionMiddleware(
        AUTH_PERMISSIONS.REPORTS_DASHBOARD_READ,
    )

    router.get(
        '/reports/overview',
        auth,
        read,
        feature,
        params.controllers.overview.handle,
    )
    router.get(
        '/reports/financial',
        auth,
        read,
        feature,
        params.controllers.financial.handle,
    )
    router.get(
        '/reports/inventory',
        auth,
        read,
        feature,
        params.controllers.inventory.handle,
    )
    router.get('/reports/hr', auth, read, feature, params.controllers.hr.handle)
    router.get(
        '/reports/loans',
        auth,
        read,
        feature,
        params.controllers.loans.handle,
    )
    router.get(
        '/reports/tasks',
        auth,
        read,
        feature,
        params.controllers.tasks.handle,
    )

    return router
}
