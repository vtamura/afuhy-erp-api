import type { RequestHandler } from 'express'
import type { PayrollProvisionFinancialPort } from '../../application/ports/payroll-provision-financial.port'
import type { HrRepository } from '../../domain/repositories/hr.repository'

export type HrHttpRouterFactoryDependencies = {
    hrRepository: HrRepository
    payrollProvisionFinancialPort: PayrollProvisionFinancialPort
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
