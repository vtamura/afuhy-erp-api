import type { RequestHandler } from 'express'
import type { AuditLogger } from '../../../audit/application/services/audit.service'
import type { StripeGateway } from '../../application/ports/stripe-gateway'
import type { BillingRepository } from '../../domain/repositories/billing.repository'

export type BillingHttpRouterFactoryDependencies = {
    billingRepository: BillingRepository
    stripeGateway: StripeGateway
    auditLogger: AuditLogger
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
            options?: { organizationIdParam?: string },
        ) => RequestHandler
    }
}
