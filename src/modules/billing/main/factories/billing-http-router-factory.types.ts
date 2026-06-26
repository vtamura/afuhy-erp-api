import type { RequestHandler } from 'express'
import type { StripeGateway } from '../../application/ports/stripe-gateway'
import type { BillingRepository } from '../../domain/repositories/billing.repository'

export type BillingHttpRouterFactoryDependencies = {
    billingRepository: BillingRepository
    stripeGateway: StripeGateway
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
            options?: { organizationIdParam?: string },
        ) => RequestHandler
    }
}
