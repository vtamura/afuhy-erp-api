import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { BillingRepository } from '../../domain/repositories/billing.repository'
import type { SubscriptionResponseDto } from '../dto'
import { toSubscriptionResponseDto } from '../mappers/billing-response.mapper'

type GetCurrentSubscriptionUseCaseInput = {
    organizationId: string | null
}

export class GetCurrentSubscriptionUseCase {
    constructor(private readonly billingRepository: BillingRepository) {}

    async execute(
        input: GetCurrentSubscriptionUseCaseInput,
    ): Promise<SubscriptionResponseDto> {
        if (!input.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const subscription =
            await this.billingRepository.findCurrentSubscriptionByOrganization(
                input.organizationId,
            )

        if (!subscription) {
            throw new NotFoundError('Assinatura nao encontrada')
        }

        return toSubscriptionResponseDto(subscription)
    }
}
