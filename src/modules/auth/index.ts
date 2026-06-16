import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import {
    CreateOrganizationUseCase,
    CreateUserUseCase,
    DeleteUserUseCase,
    ListOrganizationMembersUseCase,
    ListOrganizationsUseCase,
    ListUsersUseCase,
    LoginUseCase,
    LogoutUseCase,
    RefreshSessionUseCase,
    SelectOrganizationUseCase,
    UpdateUserUseCase,
} from './application/use-cases'
import { PostgresOrganizationRepository } from './infrastructure/repositories/postgres-organization.repository'
import { PostgresOrganizationUserRepository } from './infrastructure/repositories/postgres-organization-user.repository'
import { PostgresRoleRepository } from './infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from './infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from './infrastructure/repositories/postgres-user.repository'
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher'
import { JwtTokenService } from './infrastructure/security/jwt-token.service'
import { Sha256RefreshTokenHasher } from './infrastructure/security/sha256-refresh-token-hasher'
import {
    CreateOrganizationController,
    CreateUserController,
    DeleteUserController,
    ListOrganizationMembersController,
    ListOrganizationsController,
    ListUsersController,
    LoginController,
    LogoutController,
    RefreshSessionController,
    SelectOrganizationController,
    UpdateUserController,
} from './presentation/http/controllers'
import { createAuthenticateAccessTokenMiddleware } from './presentation/http/middlewares/authenticate-access-token.middleware'
import {
    createAuthRouter,
    createOrganizationsRouter,
    createUsersRouter,
} from './presentation/http/routes'

export type AuthModule = {
    authRouter: ReturnType<typeof createAuthRouter>
    organizationsRouter: ReturnType<typeof createOrganizationsRouter>
    usersRouter: ReturnType<typeof createUsersRouter>
}

export function createAuthModule(): AuthModule {
    const databaseClient = getDatabaseClient()
    const userRepository = new PostgresUserRepository(databaseClient)
    const organizationRepository = new PostgresOrganizationRepository(
        databaseClient,
    )
    const organizationUserRepository = new PostgresOrganizationUserRepository(
        databaseClient,
    )
    const roleRepository = new PostgresRoleRepository(databaseClient)
    const sessionRepository = new PostgresSessionRepository(databaseClient)
    const passwordHasher = new BcryptPasswordHasher()
    const refreshTokenHasher = new Sha256RefreshTokenHasher()
    const tokenService = new JwtTokenService()

    const createUserUseCase = new CreateUserUseCase(
        userRepository,
        passwordHasher,
    )
    const createOrganizationUseCase = new CreateOrganizationUseCase(
        organizationRepository,
        organizationUserRepository,
        roleRepository,
    )
    const listOrganizationsUseCase = new ListOrganizationsUseCase(
        organizationRepository,
    )
    const listOrganizationMembersUseCase = new ListOrganizationMembersUseCase(
        organizationRepository,
        organizationUserRepository,
    )
    const listUsersUseCase = new ListUsersUseCase(userRepository)
    const updateUserUseCase = new UpdateUserUseCase(userRepository)
    const deleteUserUseCase = new DeleteUserUseCase(userRepository)
    const loginUseCase = new LoginUseCase(
        userRepository,
        organizationRepository,
        sessionRepository,
        passwordHasher,
        refreshTokenHasher,
        tokenService,
    )
    const refreshSessionUseCase = new RefreshSessionUseCase(
        userRepository,
        organizationRepository,
        sessionRepository,
        refreshTokenHasher,
        tokenService,
    )
    const selectOrganizationUseCase = new SelectOrganizationUseCase(
        userRepository,
        sessionRepository,
        organizationRepository,
        organizationUserRepository,
        refreshTokenHasher,
        tokenService,
    )
    const logoutUseCase = new LogoutUseCase(sessionRepository, tokenService)

    const createUserController = new CreateUserController(createUserUseCase)
    const createOrganizationController = new CreateOrganizationController(
        createOrganizationUseCase,
    )
    const listOrganizationsController = new ListOrganizationsController(
        listOrganizationsUseCase,
    )
    const listOrganizationMembersController =
        new ListOrganizationMembersController(listOrganizationMembersUseCase)
    const listUsersController = new ListUsersController(listUsersUseCase)
    const updateUserController = new UpdateUserController(updateUserUseCase)
    const deleteUserController = new DeleteUserController(deleteUserUseCase)
    const loginController = new LoginController(loginUseCase)
    const refreshSessionController = new RefreshSessionController(
        refreshSessionUseCase,
    )
    const selectOrganizationController = new SelectOrganizationController(
        selectOrganizationUseCase,
    )
    const logoutController = new LogoutController(logoutUseCase)
    const authenticateAccessTokenMiddleware =
        createAuthenticateAccessTokenMiddleware(userRepository, tokenService)

    return {
        authRouter: createAuthRouter({
            loginController,
            refreshSessionController,
            logoutController,
            selectOrganizationController,
        }),
        organizationsRouter: createOrganizationsRouter({
            createOrganizationController,
            listOrganizationsController,
            listOrganizationMembersController,
            authenticateAccessTokenMiddleware,
        }),
        usersRouter: createUsersRouter({
            createUserController,
            listUsersController,
            updateUserController,
            deleteUserController,
            authenticateAccessTokenMiddleware,
        }),
    }
}
