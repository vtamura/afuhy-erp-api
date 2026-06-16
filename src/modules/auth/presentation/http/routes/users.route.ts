import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../domain/rbac/default-rbac'
import type {
    CreateUserController,
    DeleteUserController,
    ListUsersController,
    UpdateUserController,
} from '../controllers'

type CreateUsersRouterParams = {
    createUserController: CreateUserController
    listUsersController: ListUsersController
    updateUserController: UpdateUserController
    deleteUserController: DeleteUserController
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
}

export function createUsersRouter({
    createUserController,
    listUsersController,
    updateUserController,
    deleteUserController,
    authenticateAccessTokenMiddleware,
    authorizePermissionMiddleware,
}: CreateUsersRouterParams): Router {
    const router = Router()

    router.post('/users', createUserController.handle)
    router.get(
        '/users',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.USERS_READ),
        listUsersController.handle,
    )
    router.patch(
        '/users/:id',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.USERS_UPDATE),
        updateUserController.handle,
    )
    router.delete(
        '/users/:id',
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware(AUTH_PERMISSIONS.USERS_DELETE),
        deleteUserController.handle,
    )

    return router
}
