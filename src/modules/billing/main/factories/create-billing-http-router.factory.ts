import {
    CreateStripeCheckoutSessionUseCase,
    CreateStripePortalSessionUseCase,
    GetCurrentSubscriptionUseCase,
    HandleStripeWebhookUseCase,
    ListPlansUseCase,
    SetOrganizationSubscriptionUseCase,
} from '../../application/use-cases'
import {
    CreateStripeCheckoutSessionController,
    CreateStripePortalSessionController,
    GetCurrentSubscriptionController,
    HandleStripeWebhookController,
    ListPlansController,
    SetOrganizationSubscriptionController,
} from '../../presentation/http/controllers'
import {
    createBillingRouter,
    createStripeWebhookRouter,
} from '../../presentation/http/routes'
import type { BillingHttpRouterFactoryDependencies } from './billing-http-router-factory.types'

export function createBillingHttpRouterFactory(
    deps: BillingHttpRouterFactoryDependencies,
) {
    const { billingRepository, stripeGateway } = deps
    const { authenticateAccessTokenMiddleware, authorizePermissionMiddleware } =
        deps.middlewares

    const listPlansUseCase = new ListPlansUseCase(billingRepository)
    const getCurrentSubscriptionUseCase = new GetCurrentSubscriptionUseCase(
        billingRepository,
    )
    const setOrganizationSubscriptionUseCase =
        new SetOrganizationSubscriptionUseCase(billingRepository)
    const createStripeCheckoutSessionUseCase =
        new CreateStripeCheckoutSessionUseCase(billingRepository, stripeGateway)
    const createStripePortalSessionUseCase =
        new CreateStripePortalSessionUseCase(billingRepository, stripeGateway)

    return createBillingRouter({
        listPlansController: new ListPlansController(listPlansUseCase),
        getCurrentSubscriptionController: new GetCurrentSubscriptionController(
            getCurrentSubscriptionUseCase,
        ),
        setOrganizationSubscriptionController:
            new SetOrganizationSubscriptionController(
                setOrganizationSubscriptionUseCase,
            ),
        createStripeCheckoutSessionController:
            new CreateStripeCheckoutSessionController(
                createStripeCheckoutSessionUseCase,
            ),
        createStripePortalSessionController:
            new CreateStripePortalSessionController(
                createStripePortalSessionUseCase,
            ),
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware,
    })
}

export function createStripeWebhookHttpRouterFactory(
    deps: BillingHttpRouterFactoryDependencies,
) {
    const handleStripeWebhookUseCase = new HandleStripeWebhookUseCase(
        deps.billingRepository,
        deps.stripeGateway,
    )

    return createStripeWebhookRouter({
        handleStripeWebhookController: new HandleStripeWebhookController(
            handleStripeWebhookUseCase,
        ),
    })
}
