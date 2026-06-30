import { env } from '../../../../shared/config/env'
import {
    BadRequestError,
    ForbiddenError,
} from '../../../../shared/domain/errors'
import type { BillingRepository } from '../../domain/repositories/billing.repository'
import type { StripeGateway } from '../ports/stripe-gateway'
import { CreateStripeCheckoutSessionUseCase } from './create-stripe-checkout-session.use-case'
import { CreateStripePortalSessionUseCase } from './create-stripe-portal-session.use-case'
import { HandleStripeWebhookUseCase } from './handle-stripe-webhook.use-case'

describe('Stripe billing use cases', () => {
    const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'
    const now = new Date('2026-01-01T00:00:00.000Z')

    const authUser = {
        userId: '4c8617da-e7e6-4ac3-98ef-72a152fe6bd8',
        sessionId: '0a1e2559-bc27-49ef-ae75-44f0f3466766',
        organizationId,
    }

    beforeEach(() => {
        jest.replaceProperty(
            env,
            'STRIPE_PRICE_STARTER_MONTHLY',
            'price_starter',
        )
        jest.replaceProperty(
            env,
            'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
            'price_professional',
        )
        jest.replaceProperty(
            env,
            'STRIPE_SUCCESS_URL',
            'http://localhost/success',
        )
        jest.replaceProperty(
            env,
            'STRIPE_CANCEL_URL',
            'http://localhost/cancel',
        )
        jest.replaceProperty(
            env,
            'STRIPE_PORTAL_RETURN_URL',
            'http://localhost/billing',
        )
        jest.replaceProperty(env, 'STRIPE_WEBHOOK_SECRET', 'whsec_test')
    })

    function makeRepository(): jest.Mocked<BillingRepository> {
        return {
            listPlans: jest.fn(),
            findPlanByCode: jest.fn().mockResolvedValue({
                id: 'ccbc994b-fd5f-496e-a66a-a9829efa91c4',
                code: 'STARTER',
                name: 'Starter',
                priceCents: 9990,
                currency: 'BRL',
                billingInterval: 'MONTH',
                maxUsers: 5,
                createdAt: now,
                features: [],
            }),
            findPlanCodeByStripePriceId: jest.fn((priceId) =>
                priceId === 'price_starter' ? 'STARTER' : null,
            ),
            findCurrentSubscriptionByOrganization: jest.fn(),
            findSubscriptionByStripeSubscriptionId: jest.fn(),
            findBillingProfileByOrganization: jest.fn().mockResolvedValue({
                id: '4af3586a-f07d-4a0c-a2be-caf62c784c38',
                organizationId,
                stripeCustomerId: 'cus_test',
                billingEmail: 'admin@example.com',
                metadata: {},
                createdAt: now,
                updatedAt: now,
            }),
            findBillingProfileByStripeCustomerId: jest.fn(),
            upsertBillingProfile: jest.fn(),
            findOrganizationBillingDetails: jest.fn().mockResolvedValue({
                organizationName: 'Afuhy',
                billingEmail: 'admin@example.com',
            }),
            setCurrentSubscription: jest.fn(),
            syncStripeSubscription: jest.fn().mockResolvedValue({
                id: '953acb97-b9e2-48bb-bce7-24a64f359274',
                organizationId,
                plan: {
                    id: 'ccbc994b-fd5f-496e-a66a-a9829efa91c4',
                    code: 'STARTER',
                    name: 'Starter',
                    priceCents: 9990,
                    currency: 'BRL',
                    billingInterval: 'MONTH',
                    maxUsers: 5,
                    createdAt: now,
                    features: [],
                },
                stripeCustomerId: 'cus_test',
                stripeSubscriptionId: 'sub_test',
                stripePriceId: 'price_starter',
                source: 'STRIPE',
                status: 'ACTIVE',
                startsAt: now,
                endsAt: null,
                currentPeriodStart: now,
                currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'),
                cancelAtPeriodEnd: false,
                createdAt: now,
                updatedAt: now,
            }),
            startStripeEventProcessing: jest.fn().mockResolvedValue({
                inserted: true,
                event: {
                    id: 'c76501ec-a011-45fd-a678-3e3a70a48dc5',
                    stripeEventId: 'evt_test',
                    type: 'customer.subscription.updated',
                    apiVersion: null,
                    livemode: false,
                    status: 'PROCESSING',
                    receivedAt: now,
                    processedAt: null,
                    error: null,
                },
            }),
            markStripeEventProcessed: jest.fn(),
            markStripeEventFailed: jest.fn(),
            withTransaction: jest.fn((callback) => callback(makeRepository())),
            organizationHasFeature: jest.fn(),
            countUsedSeats: jest.fn(),
        }
    }

    function makeStripeGateway(): jest.Mocked<StripeGateway> {
        return {
            createCustomer: jest.fn().mockResolvedValue('cus_created'),
            createCheckoutSession: jest
                .fn()
                .mockResolvedValue('https://checkout.stripe.test/session'),
            createPortalSession: jest
                .fn()
                .mockResolvedValue('https://billing.stripe.test/session'),
            constructWebhookEvent: jest.fn().mockReturnValue({
                id: 'evt_test',
                type: 'customer.subscription.updated',
                apiVersion: '2026-01-01',
                livemode: false,
                data: {
                    object: {
                        id: 'sub_test',
                    },
                },
            }),
            retrieveSubscription: jest.fn().mockResolvedValue({
                id: 'sub_test',
                customerId: 'cus_test',
                priceId: 'price_starter',
                status: 'active',
                startsAt: now,
                endsAt: null,
                currentPeriodStart: now,
                currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'),
                cancelAtPeriodEnd: false,
                organizationId,
            }),
        }
    }

    it('creates a checkout session using the configured Stripe price', async () => {
        const repository = makeRepository()
        const stripeGateway = makeStripeGateway()
        const useCase = new CreateStripeCheckoutSessionUseCase(
            repository,
            stripeGateway,
        )

        const result = await useCase.execute({
            planCode: 'STARTER',
            authUser,
        })

        expect(result.url).toBe('https://checkout.stripe.test/session')
        expect(stripeGateway.createCheckoutSession).toHaveBeenCalledWith(
            expect.objectContaining({
                customerId: 'cus_test',
                priceId: 'price_starter',
                organizationId,
                planCode: 'STARTER',
            }),
        )
    })

    it('rejects checkout without selected organization', async () => {
        const useCase = new CreateStripeCheckoutSessionUseCase(
            makeRepository(),
            makeStripeGateway(),
        )

        await expect(
            useCase.execute({
                planCode: 'STARTER',
                authUser: { ...authUser, organizationId: null },
            }),
        ).rejects.toBeInstanceOf(ForbiddenError)
    })

    it('creates a portal session for an existing Stripe customer', async () => {
        const stripeGateway = makeStripeGateway()
        const useCase = new CreateStripePortalSessionUseCase(
            makeRepository(),
            stripeGateway,
        )

        const result = await useCase.execute({ authUser })

        expect(result.url).toBe('https://billing.stripe.test/session')
        expect(stripeGateway.createPortalSession).toHaveBeenCalledWith({
            customerId: 'cus_test',
            returnUrl: 'http://localhost/billing',
        })
    })

    it('ignores duplicated webhook events', async () => {
        const repository = makeRepository()
        repository.startStripeEventProcessing.mockResolvedValueOnce({
            inserted: false,
            event: {
                id: 'c76501ec-a011-45fd-a678-3e3a70a48dc5',
                stripeEventId: 'evt_test',
                type: 'customer.subscription.updated',
                apiVersion: null,
                livemode: false,
                status: 'PROCESSED',
                receivedAt: now,
                processedAt: now,
                error: null,
            },
        })
        const stripeGateway = makeStripeGateway()
        const useCase = new HandleStripeWebhookUseCase(
            repository,
            stripeGateway,
        )

        await useCase.execute({
            payload: Buffer.from('{}'),
            signature: 'valid_signature',
        })

        expect(stripeGateway.retrieveSubscription).not.toHaveBeenCalled()
        expect(repository.markStripeEventProcessed).not.toHaveBeenCalled()
    })

    it('stores null api version when Stripe event omits api_version', async () => {
        const repository = makeRepository()
        const stripeGateway = makeStripeGateway()
        stripeGateway.constructWebhookEvent.mockReturnValueOnce({
            id: 'evt_test',
            type: 'customer.subscription.updated',
            apiVersion: undefined as unknown as null,
            livemode: false,
            data: {
                object: {
                    id: 'sub_test',
                },
            },
        })
        const useCase = new HandleStripeWebhookUseCase(
            repository,
            stripeGateway,
        )

        await useCase.execute({
            payload: Buffer.from('{}'),
            signature: 'valid_signature',
        })

        expect(repository.startStripeEventProcessing).toHaveBeenCalledWith(
            expect.objectContaining({
                apiVersion: null,
            }),
        )
    })

    it('syncs subscription data from Stripe webhook', async () => {
        const repository = makeRepository()
        const transactionalRepository = makeRepository()
        repository.withTransaction.mockImplementationOnce((callback) =>
            callback(transactionalRepository),
        )
        const useCase = new HandleStripeWebhookUseCase(
            repository,
            makeStripeGateway(),
        )

        await useCase.execute({
            payload: Buffer.from('{}'),
            signature: 'valid_signature',
        })

        expect(
            transactionalRepository.syncStripeSubscription,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId,
                planCode: 'STARTER',
                stripeCustomerId: 'cus_test',
                stripeSubscriptionId: 'sub_test',
                stripePriceId: 'price_starter',
                status: 'ACTIVE',
            }),
        )
        expect(repository.markStripeEventProcessed).toHaveBeenCalledWith(
            'evt_test',
        )
    })

    it('extracts subscription from the current Stripe invoice payload shape', async () => {
        const repository = makeRepository()
        const stripeGateway = makeStripeGateway()
        stripeGateway.constructWebhookEvent.mockReturnValueOnce({
            id: 'evt_invoice',
            type: 'invoice.payment_succeeded',
            apiVersion: '2026-01-01',
            livemode: false,
            data: {
                object: {
                    id: 'in_test',
                    object: 'invoice',
                    parent: {
                        type: 'subscription_details',
                        subscription_details: {
                            subscription: 'sub_from_parent',
                        },
                    },
                    lines: {
                        object: 'list',
                        data: [
                            {
                                parent: {
                                    type: 'subscription_item_details',
                                    subscription_item_details: {
                                        subscription: 'sub_from_line',
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        })
        const useCase = new HandleStripeWebhookUseCase(
            repository,
            stripeGateway,
        )

        await useCase.execute({
            payload: Buffer.from('{}'),
            signature: 'valid_signature',
        })

        expect(stripeGateway.retrieveSubscription).toHaveBeenCalledWith(
            'sub_from_parent',
        )
    })

    it('uses an existing synced subscription to resolve organization when metadata and profile are missing', async () => {
        const repository = makeRepository()
        repository.findBillingProfileByStripeCustomerId.mockResolvedValueOnce(
            null,
        )
        repository.findSubscriptionByStripeSubscriptionId.mockResolvedValueOnce(
            {
                id: '953acb97-b9e2-48bb-bce7-24a64f359274',
                organizationId,
                plan: {
                    id: 'ccbc994b-fd5f-496e-a66a-a9829efa91c4',
                    code: 'STARTER',
                    name: 'Starter',
                    priceCents: 9990,
                    currency: 'BRL',
                    billingInterval: 'MONTH',
                    maxUsers: 5,
                    createdAt: now,
                    features: [],
                },
                stripeCustomerId: 'cus_test',
                stripeSubscriptionId: 'sub_test',
                stripePriceId: 'price_starter',
                source: 'STRIPE',
                status: 'ACTIVE',
                startsAt: now,
                endsAt: null,
                currentPeriodStart: now,
                currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'),
                cancelAtPeriodEnd: false,
                createdAt: now,
                updatedAt: now,
            },
        )
        const stripeGateway = makeStripeGateway()
        stripeGateway.retrieveSubscription.mockResolvedValueOnce({
            id: 'sub_test',
            customerId: 'cus_missing_profile',
            priceId: 'price_starter',
            status: 'active',
            startsAt: now,
            endsAt: null,
            currentPeriodStart: now,
            currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'),
            cancelAtPeriodEnd: false,
            organizationId: null,
        })
        const useCase = new HandleStripeWebhookUseCase(
            repository,
            stripeGateway,
        )

        await useCase.execute({
            payload: Buffer.from('{}'),
            signature: 'valid_signature',
        })

        expect(
            repository.findBillingProfileByStripeCustomerId,
        ).not.toHaveBeenCalled()
        expect(repository.markStripeEventProcessed).toHaveBeenCalledWith(
            'evt_test',
        )
    })

    it('fails webhook when Stripe price is not mapped', async () => {
        const repository = makeRepository()
        repository.findPlanCodeByStripePriceId.mockReturnValueOnce(null)
        const useCase = new HandleStripeWebhookUseCase(
            repository,
            makeStripeGateway(),
        )

        await expect(
            useCase.execute({
                payload: Buffer.from('{}'),
                signature: 'valid_signature',
            }),
        ).rejects.toBeInstanceOf(BadRequestError)
        expect(repository.markStripeEventFailed).toHaveBeenCalledWith(
            'evt_test',
            expect.any(String),
        )
    })
})
