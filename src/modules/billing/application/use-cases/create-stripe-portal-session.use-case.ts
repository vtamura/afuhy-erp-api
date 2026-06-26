import { env } from '../../../../shared/config/env'
import {
    BadRequestError,
    ForbiddenError,
} from '../../../../shared/domain/errors'
import type { AuthUser } from '../../../../shared/application/contracts'
import type { BillingRepository } from '../../domain/repositories/billing.repository'
import {
    noopAuditLogger,
    type AuditLogger,
} from '../../../audit/application/services/audit.service'
import type { StripeGateway } from '../ports/stripe-gateway'
import type { StripeSessionResponseDto } from '../dto'

type Input = {
    authUser: AuthUser
    requestId?: string | null
    ipAddress?: string | null
    userAgent?: string | null
}

export class CreateStripePortalSessionUseCase {
    constructor(
        private readonly billingRepository: BillingRepository,
        private readonly stripeGateway: StripeGateway,
        private readonly auditLogger: AuditLogger = noopAuditLogger,
    ) {}

    async execute(input: Input): Promise<StripeSessionResponseDto> {
        const organizationId = input.authUser.organizationId

        if (!organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const profile =
            await this.billingRepository.findBillingProfileByOrganization(
                organizationId,
            )

        if (!profile) {
            throw new BadRequestError(
                'Organizacao ainda nao possui customer Stripe',
            )
        }

        const url = await this.stripeGateway.createPortalSession({
            customerId: profile.stripeCustomerId,
            returnUrl: env.STRIPE_PORTAL_RETURN_URL,
        })

        await this.auditLogger.log({
            organizationId,
            requestId: input.requestId ?? null,
            actorType: 'USER',
            actorUserId: input.authUser.userId,
            action: 'READ_SENSITIVE',
            module: 'billing',
            entityType: 'stripe_customer_portal',
            entityId: profile.id,
            summary: 'Sessao Stripe Customer Portal criada',
            metadata: {
                stripeCustomerId: profile.stripeCustomerId,
            },
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
        })

        return { url }
    }
}
