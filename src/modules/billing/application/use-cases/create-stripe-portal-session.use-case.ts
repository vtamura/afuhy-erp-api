import { env } from '../../../../shared/config/env'
import {
    BadRequestError,
    ForbiddenError,
} from '../../../../shared/domain/errors'
import type { AuthUser } from '../../../../shared/application/contracts'
import type { BillingRepository } from '../../domain/repositories/billing.repository'
import type { StripeGateway } from '../ports/stripe-gateway'
import type { StripeSessionResponseDto } from '../dto'

type Input = {
    authUser: AuthUser
}

export class CreateStripePortalSessionUseCase {
    constructor(
        private readonly billingRepository: BillingRepository,
        private readonly stripeGateway: StripeGateway,
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

        return { url }
    }
}
