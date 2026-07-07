import {
    CreateUserUseCase,
    DeleteUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
} from '../../application/use-cases'
import {
    CreateUserController,
    DeleteUserController,
    ListUsersController,
    UpdateUserController,
} from '../../presentation/http/controllers'
import { createUsersRouter } from '../../presentation/http/routes'
import type { AuthHttpRouterFactoryDependencies } from './auth-http-router-factory.types'

export function createUsersHttpRouterFactory(
    deps: AuthHttpRouterFactoryDependencies,
) {
    const { userRepository } = deps.repositories
    const { passwordHasher } = deps.security
    const { emailNotifier } = deps.queues
    const { authenticateAccessTokenMiddleware, authorizePermissionMiddleware } =
        deps.middlewares

    const createUserUseCase = new CreateUserUseCase(
        userRepository,
        passwordHasher,
        emailNotifier,
    )
    const listUsersUseCase = new ListUsersUseCase(userRepository)
    const updateUserUseCase = new UpdateUserUseCase(userRepository)
    const deleteUserUseCase = new DeleteUserUseCase(userRepository)

    return createUsersRouter({
        createUserController: new CreateUserController(createUserUseCase),
        listUsersController: new ListUsersController(listUsersUseCase),
        updateUserController: new UpdateUserController(updateUserUseCase),
        deleteUserController: new DeleteUserController(deleteUserUseCase),
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware,
    })
}
