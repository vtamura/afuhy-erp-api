import type { RequestHandler } from 'express'
import type { BillingRepository } from '../../domain/repositories/billing.repository'

export type BillingHttpRouterFactoryDependencies = {
    billingRepository: BillingRepository
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
            options?: { organizationIdParam?: string },
        ) => RequestHandler
    }
}
