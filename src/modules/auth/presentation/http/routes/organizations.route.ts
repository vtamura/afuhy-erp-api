import { Router, type RequestHandler } from 'express'
import type {
    CreateOrganizationController,
    ListOrganizationMembersController,
    ListOrganizationsController,
} from '../controllers'

type CreateOrganizationsRouterParams = {
    createOrganizationController: CreateOrganizationController
    listOrganizationsController: ListOrganizationsController
    listOrganizationMembersController: ListOrganizationMembersController
    authenticateAccessTokenMiddleware: RequestHandler
}

export function createOrganizationsRouter({
    createOrganizationController,
    listOrganizationsController,
    listOrganizationMembersController,
    authenticateAccessTokenMiddleware,
}: CreateOrganizationsRouterParams): Router {
    const router = Router()

    router.post(
        '/organizations',
        authenticateAccessTokenMiddleware,
        createOrganizationController.handle,
    )
    router.get(
        '/organizations',
        authenticateAccessTokenMiddleware,
        listOrganizationsController.handle,
    )
    router.get(
        '/organizations/:id/members',
        authenticateAccessTokenMiddleware,
        listOrganizationMembersController.handle,
    )

    return router
}
