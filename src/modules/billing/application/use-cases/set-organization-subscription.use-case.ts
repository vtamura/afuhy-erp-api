import { NotFoundError } from '../../../../shared/domain/errors'
import type {
    BillingRepository,
    SetOrganizationSubscriptionInput,
} from '../../domain/repositories/billing.repository'
import type { SubscriptionResponseDto } from '../dto'
import { toSubscriptionResponseDto } from '../mappers/billing-response.mapper'

type SetOrganizationSubscriptionUseCaseInput = {
    organizationId: string
    planCode: SetOrganizationSubscriptionInput['planCode']
    status: SetOrganizationSubscriptionInput['status']
    startsAt?: string
    endsAt?: string | null
}

export class SetOrganizationSubscriptionUseCase {
    constructor(private readonly billingRepository: BillingRepository) {}

    async execute(
        input: SetOrganizationSubscriptionUseCaseInput,
    ): Promise<SubscriptionResponseDto> {
        const plan = await this.billingRepository.findPlanByCode(input.planCode)

        if (!plan) {
            throw new NotFoundError('Plano nao encontrado')
        }

        const subscription =
            await this.billingRepository.setCurrentSubscription({
                organizationId: input.organizationId,
                planCode: input.planCode,
                status: input.status,
                startsAt: input.startsAt
                    ? new Date(input.startsAt)
                    : new Date(),
                endsAt: input.endsAt ? new Date(input.endsAt) : null,
            })

        return toSubscriptionResponseDto(subscription)
    }
}
