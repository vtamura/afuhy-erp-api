import type {
    BillingProfileEntity,
    PlanCode,
    PlanEntity,
    StripeEventEntity,
    StripeEventStatus,
    SubscriptionEntity,
    SubscriptionSource,
    SubscriptionStatus,
} from '../entities/billing.entity'

export type SetOrganizationSubscriptionInput = {
    organizationId: string
    planCode: PlanCode
    status: SubscriptionStatus
    startsAt: Date
    endsAt: Date | null
    source?: SubscriptionSource
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    stripePriceId?: string | null
    currentPeriodStart?: Date | null
    currentPeriodEnd?: Date | null
    cancelAtPeriodEnd?: boolean
}

export type UpsertBillingProfileInput = {
    organizationId: string
    stripeCustomerId: string
    billingEmail: string | null
    metadata?: Record<string, unknown>
}

export type StartStripeEventProcessingInput = {
    stripeEventId: string
    type: string
    apiVersion: string | null
    livemode: boolean
    payload: Record<string, unknown>
}

export type SyncStripeSubscriptionInput = {
    organizationId: string
    planCode: PlanCode
    stripeCustomerId: string
    stripeSubscriptionId: string
    stripePriceId: string
    status: SubscriptionStatus
    startsAt: Date
    endsAt: Date | null
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
}

export interface BillingRepository {
    listPlans(): Promise<PlanEntity[]>
    findPlanByCode(planCode: PlanCode): Promise<PlanEntity | null>
    findPlanCodeByStripePriceId(stripePriceId: string): PlanCode | null
    findCurrentSubscriptionByOrganization(
        organizationId: string,
    ): Promise<SubscriptionEntity | null>
    findSubscriptionByStripeSubscriptionId(
        stripeSubscriptionId: string,
    ): Promise<SubscriptionEntity | null>
    findBillingProfileByOrganization(
        organizationId: string,
    ): Promise<BillingProfileEntity | null>
    findBillingProfileByStripeCustomerId(
        stripeCustomerId: string,
    ): Promise<BillingProfileEntity | null>
    upsertBillingProfile(
        input: UpsertBillingProfileInput,
    ): Promise<BillingProfileEntity>
    findOrganizationBillingDetails(organizationId: string): Promise<{
        organizationName: string
        billingEmail: string | null
    } | null>
    setCurrentSubscription(
        input: SetOrganizationSubscriptionInput,
    ): Promise<SubscriptionEntity>
    syncStripeSubscription(
        input: SyncStripeSubscriptionInput,
    ): Promise<SubscriptionEntity>
    startStripeEventProcessing(
        input: StartStripeEventProcessingInput,
    ): Promise<{ event: StripeEventEntity; inserted: boolean }>
    markStripeEventProcessed(stripeEventId: string): Promise<void>
    markStripeEventFailed(stripeEventId: string, error: string): Promise<void>
    withTransaction<T>(
        callback: (billingRepository: BillingRepository) => Promise<T>,
    ): Promise<T>
    organizationHasFeature(input: {
        organizationId: string
        featureCode: string
    }): Promise<boolean>
    countUsedSeats(organizationId: string): Promise<number>
}
