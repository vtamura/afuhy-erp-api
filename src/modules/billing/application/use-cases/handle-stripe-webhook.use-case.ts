import { env } from '../../../../shared/config/env'
import {
    BadRequestError,
    InternalServerError,
} from '../../../../shared/domain/errors'
import type {
    PlanCode,
    SubscriptionStatus,
} from '../../domain/entities/billing.entity'
import type { BillingRepository } from '../../domain/repositories/billing.repository'
import type {
    StripeGateway,
    StripeSubscriptionSnapshot,
    StripeWebhookEvent,
} from '../ports/stripe-gateway'

type Input = {
    payload: Buffer
    signature: string | undefined
}

export class HandleStripeWebhookUseCase {
    constructor(
        private readonly billingRepository: BillingRepository,
        private readonly stripeGateway: StripeGateway,
    ) {}

    async execute(input: Input): Promise<void> {
        if (!input.signature) {
            throw new BadRequestError('Assinatura Stripe ausente')
        }

        if (!env.STRIPE_WEBHOOK_SECRET) {
            throw new InternalServerError(
                'Stripe webhook secret nao configurado',
            )
        }

        let event: StripeWebhookEvent

        try {
            event = this.stripeGateway.constructWebhookEvent({
                payload: input.payload,
                signature: input.signature,
                webhookSecret: env.STRIPE_WEBHOOK_SECRET,
            })
        } catch {
            throw new BadRequestError('Assinatura Stripe invalida')
        }

        const processing =
            await this.billingRepository.startStripeEventProcessing({
                stripeEventId: event.id,
                type: event.type,
                apiVersion: event.apiVersion,
                livemode: event.livemode,
                payload: event as unknown as Record<string, unknown>,
            })

        if (!processing.inserted) {
            return
        }

        try {
            await this.processEvent(event)
            await this.billingRepository.markStripeEventProcessed(event.id)
        } catch (error) {
            await this.billingRepository.markStripeEventFailed(
                event.id,
                error instanceof Error ? error.message : 'Erro desconhecido',
            )
            throw error
        }
    }

    private async processEvent(event: StripeWebhookEvent): Promise<void> {
        if (
            event.type === 'checkout.session.completed' ||
            event.type === 'customer.subscription.created' ||
            event.type === 'customer.subscription.updated' ||
            event.type === 'customer.subscription.deleted' ||
            event.type === 'invoice.payment_succeeded' ||
            event.type === 'invoice.payment_failed'
        ) {
            const subscriptionId = this.extractSubscriptionId(event)

            if (!subscriptionId) {
                return
            }

            const snapshot =
                await this.stripeGateway.retrieveSubscription(subscriptionId)

            await this.syncSubscription(snapshot, event)
        }
    }

    private extractSubscriptionId(event: StripeWebhookEvent): string | null {
        const object = event.data.object

        if (
            event.type.startsWith('customer.subscription.') &&
            typeof object.id === 'string'
        ) {
            return object.id
        }

        const subscription = object.subscription

        if (typeof subscription === 'string') {
            return subscription
        }

        if (
            subscription &&
            typeof subscription === 'object' &&
            'id' in subscription &&
            typeof subscription.id === 'string'
        ) {
            return subscription.id
        }

        return null
    }

    private async syncSubscription(
        snapshot: StripeSubscriptionSnapshot,
        event: StripeWebhookEvent,
    ): Promise<void> {
        if (!snapshot.priceId) {
            throw new BadRequestError('Assinatura Stripe sem price ID')
        }

        const planCode = this.resolvePlanCode(snapshot.priceId)
        const organizationId = await this.resolveOrganizationId(snapshot, event)

        await this.billingRepository.withTransaction(async (repository) => {
            await repository.upsertBillingProfile({
                organizationId,
                stripeCustomerId: snapshot.customerId,
                billingEmail: null,
                metadata: {
                    source: 'webhook',
                },
            })

            await repository.syncStripeSubscription({
                organizationId,
                planCode,
                stripeCustomerId: snapshot.customerId,
                stripeSubscriptionId: snapshot.id,
                stripePriceId: snapshot.priceId,
                status: this.mapStatus(snapshot.status),
                startsAt: snapshot.startsAt,
                endsAt: snapshot.endsAt,
                currentPeriodStart: snapshot.currentPeriodStart,
                currentPeriodEnd: snapshot.currentPeriodEnd,
                cancelAtPeriodEnd: snapshot.cancelAtPeriodEnd,
            })
        })
    }

    private resolvePlanCode(stripePriceId: string): PlanCode {
        const planCode =
            this.billingRepository.findPlanCodeByStripePriceId(stripePriceId)

        if (!planCode) {
            throw new BadRequestError(
                `Price ID Stripe nao mapeado: ${stripePriceId}`,
            )
        }

        return planCode
    }

    private async resolveOrganizationId(
        snapshot: StripeSubscriptionSnapshot,
        event: StripeWebhookEvent,
    ): Promise<string> {
        const objectOrganizationId = this.readStringMetadata(
            event.data.object,
            'organizationId',
        )

        if (objectOrganizationId) {
            return objectOrganizationId
        }

        if (snapshot.organizationId) {
            return snapshot.organizationId
        }

        const profile =
            await this.billingRepository.findBillingProfileByStripeCustomerId(
                snapshot.customerId,
            )

        if (!profile) {
            throw new BadRequestError(
                'Customer Stripe nao vinculado a organizacao',
            )
        }

        return profile.organizationId
    }

    private readStringMetadata(
        object: Record<string, unknown>,
        key: string,
    ): string | null {
        const metadata = object.metadata

        if (!metadata || typeof metadata !== 'object') {
            return null
        }

        const value = (metadata as Record<string, unknown>)[key]
        return typeof value === 'string' && value ? value : null
    }

    private mapStatus(status: string): SubscriptionStatus {
        if (status === 'active') {
            return 'ACTIVE'
        }

        if (status === 'trialing') {
            return 'TRIALING'
        }

        if (status === 'past_due' || status === 'unpaid') {
            return 'PAST_DUE'
        }

        if (status === 'canceled') {
            return 'CANCELED'
        }

        return 'EXPIRED'
    }
}
