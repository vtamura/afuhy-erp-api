export type StripeCheckoutSessionInput = {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    organizationId: string
    planCode: string
}

export type StripePortalSessionInput = {
    customerId: string
    returnUrl: string
}

export type StripeCustomerInput = {
    organizationId: string
    organizationName: string
    email: string | null
}

export type StripeSubscriptionSnapshot = {
    id: string
    customerId: string
    priceId: string
    status: string
    startsAt: Date
    endsAt: Date | null
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
    organizationId: string | null
}

export type StripeWebhookEvent = {
    id: string
    type: string
    apiVersion: string | null
    livemode: boolean
    data: {
        object: Record<string, unknown>
    }
}

export interface StripeGateway {
    createCustomer(input: StripeCustomerInput): Promise<string>
    createCheckoutSession(input: StripeCheckoutSessionInput): Promise<string>
    createPortalSession(input: StripePortalSessionInput): Promise<string>
    constructWebhookEvent(input: {
        payload: Buffer
        signature: string
        webhookSecret: string
    }): StripeWebhookEvent
    retrieveSubscription(
        subscriptionId: string,
    ): Promise<StripeSubscriptionSnapshot>
}
