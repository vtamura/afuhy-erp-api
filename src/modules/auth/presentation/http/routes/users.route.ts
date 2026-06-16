import { Router, type RequestHandler } from 'express'
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
}

export function createUsersRouter({
    createUserController,
    listUsersController,
    updateUserController,
    deleteUserController,
    authenticateAccessTokenMiddleware,
}: CreateUsersRouterParams): Router {
    const router = Router()

    router.post('/users', createUserController.handle)
    router.get(
        '/users',
        authenticateAccessTokenMiddleware,
        listUsersController.handle,
    )
    router.patch(
        '/users/:id',
        authenticateAccessTokenMiddleware,
        updateUserController.handle,
    )
    router.delete(
        '/users/:id',
        authenticateAccessTokenMiddleware,
        deleteUserController.handle,
    )

    return router
}
