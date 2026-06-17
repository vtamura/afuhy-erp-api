export type PlanCode = 'STARTER' | 'PROFESSIONAL'
export type SubscriptionStatus =
    | 'TRIALING'
    | 'ACTIVE'
    | 'PAST_DUE'
    | 'CANCELED'
    | 'EXPIRED'

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
    maxUsers: number
    createdAt: Date
    features: FeatureEntity[]
}

export type SubscriptionEntity = {
    id: string
    organizationId: string
    plan: PlanEntity
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    status: SubscriptionStatus
    startsAt: Date
    endsAt: Date | null
    createdAt: Date
    updatedAt: Date
}
