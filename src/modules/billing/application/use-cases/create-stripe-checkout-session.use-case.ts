import { env } from '../../../../shared/config/env'
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type { AuthUser } from '../../../../shared/application/contracts'
import type { PlanCode } from '../../domain/entities/billing.entity'
import type { BillingRepository } from '../../domain/repositories/billing.repository'
import type { StripeGateway } from '../ports/stripe-gateway'
import type { StripeSessionResponseDto } from '../dto'

type Input = {
    planCode: PlanCode
    authUser: AuthUser
}

export class CreateStripeCheckoutSessionUseCase {
    constructor(
        private readonly billingRepository: BillingRepository,
        private readonly stripeGateway: StripeGateway,
    ) {}

    async execute(input: Input): Promise<StripeSessionResponseDto> {
        const organizationId = input.authUser.organizationId

        if (!organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const plan = await this.billingRepository.findPlanByCode(input.planCode)

        if (!plan) {
            throw new NotFoundError('Plano nao encontrado')
        }

        const priceId = this.getPriceId(input.planCode)

        const profile = await this.ensureBillingProfile(organizationId)
        const url = await this.stripeGateway.createCheckoutSession({
            customerId: profile.stripeCustomerId,
            priceId,
            successUrl: env.STRIPE_SUCCESS_URL,
            cancelUrl: env.STRIPE_CANCEL_URL,
            organizationId,
            planCode: input.planCode,
        })

        return { url }
    }

    private getPriceId(planCode: PlanCode): string {
        const priceId =
            planCode === 'STARTER'
                ? env.STRIPE_PRICE_STARTER_MONTHLY
                : env.STRIPE_PRICE_PROFESSIONAL_MONTHLY

        if (!priceId) {
            throw new BadRequestError(
                `Price ID Stripe nao configurado para o plano ${planCode}`,
            )
        }

        return priceId
    }

    private async ensureBillingProfile(organizationId: string) {
        const existing =
            await this.billingRepository.findBillingProfileByOrganization(
                organizationId,
            )

        if (existing) {
            return existing
        }

        const details =
            await this.billingRepository.findOrganizationBillingDetails(
                organizationId,
            )

        if (!details) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const stripeCustomerId = await this.stripeGateway.createCustomer({
            organizationId,
            organizationName: details.organizationName,
            email: details.billingEmail,
        })

        return this.billingRepository.upsertBillingProfile({
            organizationId,
            stripeCustomerId,
            billingEmail: details.billingEmail,
            metadata: {
                source: 'checkout',
            },
        })
    }
}
