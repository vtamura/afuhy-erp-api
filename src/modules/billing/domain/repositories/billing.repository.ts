import type {
    PlanCode,
    PlanEntity,
    SubscriptionEntity,
    SubscriptionStatus,
} from '../entities/billing.entity'

export type SetOrganizationSubscriptionInput = {
    organizationId: string
    planCode: PlanCode
    status: SubscriptionStatus
    startsAt: Date
    endsAt: Date | null
}

export interface BillingRepository {
    listPlans(): Promise<PlanEntity[]>
    findPlanByCode(planCode: PlanCode): Promise<PlanEntity | null>
    findCurrentSubscriptionByOrganization(
        organizationId: string,
    ): Promise<SubscriptionEntity | null>
    setCurrentSubscription(
        input: SetOrganizationSubscriptionInput,
    ): Promise<SubscriptionEntity>
    organizationHasFeature(input: {
        organizationId: string
        featureCode: string
    }): Promise<boolean>
    countUsedSeats(organizationId: string): Promise<number>
}
