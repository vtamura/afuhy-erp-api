import {
    GetCurrentSubscriptionUseCase,
    ListPlansUseCase,
    SetOrganizationSubscriptionUseCase,
} from '../../application/use-cases'
import {
    GetCurrentSubscriptionController,
    ListPlansController,
    SetOrganizationSubscriptionController,
} from '../../presentation/http/controllers'
import { createBillingRouter } from '../../presentation/http/routes'
import type { BillingHttpRouterFactoryDependencies } from './billing-http-router-factory.types'

export function createBillingHttpRouterFactory(
    deps: BillingHttpRouterFactoryDependencies,
) {
    const { billingRepository } = deps
    const { authenticateAccessTokenMiddleware, authorizePermissionMiddleware } =
        deps.middlewares

    const listPlansUseCase = new ListPlansUseCase(billingRepository)
    const getCurrentSubscriptionUseCase = new GetCurrentSubscriptionUseCase(
        billingRepository,
    )
    const setOrganizationSubscriptionUseCase =
        new SetOrganizationSubscriptionUseCase(billingRepository)

    return createBillingRouter({
        listPlansController: new ListPlansController(listPlansUseCase),
        getCurrentSubscriptionController: new GetCurrentSubscriptionController(
            getCurrentSubscriptionUseCase,
        ),
        setOrganizationSubscriptionController:
            new SetOrganizationSubscriptionController(
                setOrganizationSubscriptionUseCase,
            ),
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware,
    })
}
