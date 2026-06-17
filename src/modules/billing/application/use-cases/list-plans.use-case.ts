import type { BillingRepository } from '../../domain/repositories/billing.repository'
import type { PlanResponseDto } from '../dto'
import { toPlanResponseDto } from '../mappers/billing-response.mapper'

export class ListPlansUseCase {
    constructor(private readonly billingRepository: BillingRepository) {}

    async execute(): Promise<PlanResponseDto[]> {
        const plans = await this.billingRepository.listPlans()

        return plans.map(toPlanResponseDto)
    }
}
