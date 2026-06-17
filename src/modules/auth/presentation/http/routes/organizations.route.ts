import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../domain/rbac/default-rbac'
import type {
    AddOrganizationMemberController,
    CancelOrganizationInvitationController,
    CreateOrganizationController,
    CreateOrganizationInvitationController,
    ListOrganizationInvitationsController,
    ListOrganizationMembersController,
    ListOrganizationRolesController,
    ListOrganizationsController,
    RemoveOrganizationMemberController,
    UpdateMemberRolesController,
} from '../controllers'

type CreateOrganizationsRouterParams = {
    createOrganizationController: CreateOrganizationController
    listOrganizationsController: ListOrganizationsController
    listOrganizationMembersController: ListOrganizationMembersController
    listOrganizationRolesController: ListOrganizationRolesController
    createOrganizationInvitationController: CreateOrganizationInvitationController
    listOrganizationInvitationsController: ListOrganizationInvitationsController
    cancelOrganizationInvitationController: CancelOrganizationInvitationController
    addOrganizationMemberController: AddOrganizationMemberController
    updateMemberRolesController: UpdateMemberRolesController
    removeOrganizationMemberController: RemoveOrganizationMemberController
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (
        permissionCode: string,
        options?: { organizationIdParam?: string },
    ) => RequestHandler
    enforceUserLimitMiddleware?: (options?: {
        organizationIdParam?: string
    }) => RequestHandler
}

export function createOrganizationsRouter({
    createOrganizationController,
    listOrganizationsController,
    listOrganizationMembersController,
    listOrganizationRolesController,
    createOrganizationInvitationController,
    listOrganizationInvitationsController,
    cancelOrganizationInvitationController,
    addOrganizationMemberController,
    updateMemberRolesController,
    removeOrganizationMemberController,
    authenticateAccessTokenMiddleware,
    authorizePermissionMiddleware,
    enforceUserLimitMiddleware,
}: CreateOrganizationsRouterParams): Router {
    const router = Router()
    const enforceUserLimit =
        enforceUserLimitMiddleware ?? (() => (_req, _res, next) => next())

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
        '/organizations/:id/invitations',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.MEMBERS_READ, {
            organizationIdParam: 'id',
        }),
        listOrganizationInvitationsController.handle,
    )
    router.post(
        '/organizations/:id/invitations',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.MEMBERS_MANAGE, {
            organizationIdParam: 'id',
        }),
        enforceUserLimit({ organizationIdParam: 'id' }),
        createOrganizationInvitationController.handle,
    )
    router.delete(
        '/organizations/:id/invitations/:invitationId',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.MEMBERS_MANAGE, {
            organizationIdParam: 'id',
        }),
        cancelOrganizationInvitationController.handle,
    )
    router.get(
        '/organizations/:id/roles',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.MEMBERS_READ, {
            organizationIdParam: 'id',
        }),
        listOrganizationRolesController.handle,
    )
    router.get(
        '/organizations/:id/members',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.MEMBERS_READ, {
            organizationIdParam: 'id',
        }),
        listOrganizationMembersController.handle,
    )
    router.post(
        '/organizations/:id/members',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.MEMBERS_MANAGE, {
            organizationIdParam: 'id',
        }),
        enforceUserLimit({ organizationIdParam: 'id' }),
        addOrganizationMemberController.handle,
    )
    router.put(
        '/organizations/:id/members/:organizationUserId/roles',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.MEMBERS_MANAGE, {
            organizationIdParam: 'id',
        }),
        updateMemberRolesController.handle,
    )
    router.delete(
        '/organizations/:id/members/:organizationUserId',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.MEMBERS_MANAGE, {
            organizationIdParam: 'id',
        }),
        removeOrganizationMemberController.handle,
    )

    return router
}
