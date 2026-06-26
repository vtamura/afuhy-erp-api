import Stripe from 'stripe'
import { env } from '../../../../shared/config/env'
import { InternalServerError } from '../../../../shared/domain/errors'
import type {
    StripeCheckoutSessionInput,
    StripeCustomerInput,
    StripeGateway,
    StripePortalSessionInput,
    StripeSubscriptionSnapshot,
    StripeWebhookEvent,
} from '../../application/ports/stripe-gateway'

export class StripeSdkGateway implements StripeGateway {
    private stripeClient: Stripe | null = null

    constructor(private readonly secretKey = env.STRIPE_SECRET_KEY) {}

    private get stripe(): Stripe {
        if (!this.secretKey) {
            throw new InternalServerError('Stripe secret key nao configurada')
        }

        this.stripeClient ??= new Stripe(this.secretKey)
        return this.stripeClient
    }

    async createCustomer(input: StripeCustomerInput): Promise<string> {
        const customer = await this.stripe.customers.create({
            email: input.email ?? undefined,
            name: input.organizationName,
            metadata: {
                organizationId: input.organizationId,
            },
        })

        return customer.id
    }

    async createCheckoutSession(
        input: StripeCheckoutSessionInput,
    ): Promise<string> {
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: input.customerId,
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            line_items: [
                {
                    price: input.priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                organizationId: input.organizationId,
                planCode: input.planCode,
            },
            subscription_data: {
                metadata: {
                    organizationId: input.organizationId,
                    planCode: input.planCode,
                },
            },
        })

        if (!session.url) {
            throw new InternalServerError('Stripe nao retornou URL do checkout')
        }

        return session.url
    }

    async createPortalSession(
        input: StripePortalSessionInput,
    ): Promise<string> {
        const session = await this.stripe.billingPortal.sessions.create({
            customer: input.customerId,
            return_url: input.returnUrl,
        })

        return session.url
    }

    constructWebhookEvent(input: {
        payload: Buffer
        signature: string
        webhookSecret: string
    }): StripeWebhookEvent {
        return this.stripe.webhooks.constructEvent(
            input.payload,
            input.signature,
            input.webhookSecret,
        ) as unknown as StripeWebhookEvent
    }

    async retrieveSubscription(
        subscriptionId: string,
    ): Promise<StripeSubscriptionSnapshot> {
        const subscription =
            await this.stripe.subscriptions.retrieve(subscriptionId)

        return this.toSubscriptionSnapshot(subscription)
    }

    private toSubscriptionSnapshot(
        subscription: Stripe.Subscription,
    ): StripeSubscriptionSnapshot {
        const item = subscription.items.data[0]
        const metadata = subscription.metadata ?? {}

        return {
            id: subscription.id,
            customerId:
                typeof subscription.customer === 'string'
                    ? subscription.customer
                    : subscription.customer.id,
            priceId: item?.price.id ?? '',
            status: subscription.status,
            startsAt: this.fromUnix(subscription.start_date) ?? new Date(),
            endsAt: this.fromUnix(subscription.ended_at),
            currentPeriodStart: this.fromUnix(
                item?.current_period_start ?? null,
            ),
            currentPeriodEnd: this.fromUnix(item?.current_period_end ?? null),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            organizationId:
                typeof metadata.organizationId === 'string'
                    ? metadata.organizationId
                    : null,
        }
    }

    private fromUnix(value: number | null | undefined): Date | null {
        return typeof value === 'number' ? new Date(value * 1000) : null
    }
}
