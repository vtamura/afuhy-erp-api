export type PlanCode = 'BUSINESS'
export type SubscriptionStatus =
    | 'TRIALING'
    | 'ACTIVE'
    | 'PAST_DUE'
    | 'CANCELED'
    | 'EXPIRED'

export type SubscriptionSource = 'MANUAL' | 'STRIPE'

export type StripeEventStatus = 'PROCESSING' | 'PROCESSED' | 'FAILED'

export type FeatureEntity = {
    id: string
    code: string
    description: string | null
}

export type PlanEntity = {
    id: string
    code: PlanCode
    name: string
    priceCents: number
    currency: string
    billingInterval: string
    includedUsers: number
    createdAt: Date
    features: FeatureEntity[]
}

export type SubscriptionEntity = {
    id: string
    organizationId: string
    plan: PlanEntity
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripePriceId: string | null
    stripeBaseItemId: string | null
    stripeExtraSeatItemId: string | null
    includedUsersSnapshot: number
    additionalSeats: number
    seatLimit: number
    source: SubscriptionSource
    status: SubscriptionStatus
    startsAt: Date
    endsAt: Date | null
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
    createdAt: Date
    updatedAt: Date
}

export type BillingProfileEntity = {
    id: string
    organizationId: string
    stripeCustomerId: string
    billingEmail: string | null
    metadata: Record<string, unknown>
    createdAt: Date
    updatedAt: Date
}

export type StripeEventEntity = {
    id: string
    stripeEventId: string
    type: string
    apiVersion: string | null
    livemode: boolean
    status: StripeEventStatus
    receivedAt: Date
    processedAt: Date | null
    error: string | null
}
