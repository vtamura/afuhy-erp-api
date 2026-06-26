import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    CreateStripeCheckoutSessionController,
    CreateStripePortalSessionController,
    GetCurrentSubscriptionController,
    HandleStripeWebhookController,
    ListPlansController,
    SetOrganizationSubscriptionController,
} from '../controllers'

type CreateBillingRouterParams = {
    listPlansController: ListPlansController
    getCurrentSubscriptionController: GetCurrentSubscriptionController
    setOrganizationSubscriptionController: SetOrganizationSubscriptionController
    createStripeCheckoutSessionController: CreateStripeCheckoutSessionController
    createStripePortalSessionController: CreateStripePortalSessionController
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (
        permissionCode: string,
        options?: { organizationIdParam?: string },
    ) => RequestHandler
}

export function createBillingRouter({
    listPlansController,
    getCurrentSubscriptionController,
    setOrganizationSubscriptionController,
    createStripeCheckoutSessionController,
    createStripePortalSessionController,
    authenticateAccessTokenMiddleware,
    authorizePermissionMiddleware,
}: CreateBillingRouterParams): Router {
    const router = Router()

    router.get('/billing/plans', listPlansController.handle)
    router.get(
        '/billing/subscription',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.BILLING_READ),
        getCurrentSubscriptionController.handle,
    )
    router.put(
        '/billing/organizations/:id/subscription',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.BILLING_MANAGE, {
            organizationIdParam: 'id',
        }),
        setOrganizationSubscriptionController.handle,
    )
    router.post(
        '/billing/stripe/checkout-session',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.BILLING_MANAGE),
        createStripeCheckoutSessionController.handle,
    )
    router.post(
        '/billing/stripe/customer-portal',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.BILLING_MANAGE),
        createStripePortalSessionController.handle,
    )

    return router
}

export function createStripeWebhookRouter({
    handleStripeWebhookController,
}: {
    handleStripeWebhookController: HandleStripeWebhookController
}): Router {
    const router = Router()

    router.post('/', handleStripeWebhookController.handle)

    return router
}
