export type FeatureResponseDto = {
    id: string
    code: string
    description: string | null
}

export type PlanResponseDto = {
    id: string
    code: string
    name: string
    priceCents: number
    currency: string
    billingInterval: string
    maxUsers: number
    createdAt: string
    features: FeatureResponseDto[]
}

export type SubscriptionResponseDto = {
    id: string
    organizationId: string
    plan: PlanResponseDto
    source: string
    status: string
    startsAt: string
    endsAt: string | null
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    createdAt: string
    updatedAt: string
}

export type StripeSessionResponseDto = {
    url: string
}
