import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    GetCurrentSubscriptionController,
    ListPlansController,
    SetOrganizationSubscriptionController,
} from '../controllers'

type CreateBillingRouterParams = {
    listPlansController: ListPlansController
    getCurrentSubscriptionController: GetCurrentSubscriptionController
    setOrganizationSubscriptionController: SetOrganizationSubscriptionController
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

    return router
}
