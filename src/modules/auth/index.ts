import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import {
    AddOrganizationMemberUseCase,
    ChangePasswordUseCase,
    CreateOrganizationUseCase,
    CreateUserUseCase,
    DeleteUserUseCase,
    ForgotPasswordUseCase,
    ListOrganizationMembersUseCase,
    ListOrganizationsUseCase,
    ListSessionsUseCase,
    ListUsersUseCase,
    LoginUseCase,
    LogoutUseCase,
    RefreshSessionUseCase,
    ResetPasswordUseCase,
    RemoveOrganizationMemberUseCase,
    RevokeOtherSessionsUseCase,
    RevokeSessionUseCase,
    SelectOrganizationUseCase,
    UpdateMemberRolesUseCase,
    UpdateUserUseCase,
} from './application/use-cases'
import { PostgresOrganizationRepository } from './infrastructure/repositories/postgres-organization.repository'
import { PostgresOrganizationUserRepository } from './infrastructure/repositories/postgres-organization-user.repository'
import { PostgresPasswordResetTokenRepository } from './infrastructure/repositories/postgres-password-reset-token.repository'
import { PostgresRoleRepository } from './infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from './infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from './infrastructure/repositories/postgres-user.repository'
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher'
import { JwtTokenService } from './infrastructure/security/jwt-token.service'
import { Sha256RefreshTokenHasher } from './infrastructure/security/sha256-refresh-token-hasher'
import { SecureTokenGenerator } from './infrastructure/security/secure-token-generator'
import {
    AddOrganizationMemberController,
    ChangePasswordController,
    CreateOrganizationController,
    CreateUserController,
    DeleteUserController,
    ForgotPasswordController,
    ListOrganizationMembersController,
    ListOrganizationsController,
    ListSessionsController,
    ListUsersController,
    LoginController,
    LogoutController,
    RefreshSessionController,
    ResetPasswordController,
    RemoveOrganizationMemberController,
    RevokeOtherSessionsController,
    RevokeSessionController,
    SelectOrganizationController,
    UpdateMemberRolesController,
    UpdateUserController,
} from './presentation/http/controllers'
import { createAuthenticateAccessTokenMiddleware } from './presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from './presentation/http/middlewares/authorize-permission.middleware'
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
    const passwordResetTokenRepository =
        new PostgresPasswordResetTokenRepository(databaseClient)
    const passwordHasher = new BcryptPasswordHasher()
    const refreshTokenHasher = new Sha256RefreshTokenHasher()
    const secureTokenGenerator = new SecureTokenGenerator()
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
    const addOrganizationMemberUseCase = new AddOrganizationMemberUseCase(
        organizationRepository,
        organizationUserRepository,
        roleRepository,
        userRepository,
    )
    const updateMemberRolesUseCase = new UpdateMemberRolesUseCase(
        organizationRepository,
        organizationUserRepository,
        roleRepository,
    )
    const removeOrganizationMemberUseCase = new RemoveOrganizationMemberUseCase(
        organizationRepository,
        organizationUserRepository,
        roleRepository,
    )
    const listUsersUseCase = new ListUsersUseCase(userRepository)
    const updateUserUseCase = new UpdateUserUseCase(userRepository)
    const deleteUserUseCase = new DeleteUserUseCase(userRepository)
    const listSessionsUseCase = new ListSessionsUseCase(sessionRepository)
    const revokeSessionUseCase = new RevokeSessionUseCase(sessionRepository)
    const revokeOtherSessionsUseCase = new RevokeOtherSessionsUseCase(
        sessionRepository,
    )
    const changePasswordUseCase = new ChangePasswordUseCase(
        userRepository,
        sessionRepository,
        passwordHasher,
    )
    const forgotPasswordUseCase = new ForgotPasswordUseCase(
        userRepository,
        passwordResetTokenRepository,
        refreshTokenHasher,
        secureTokenGenerator,
    )
    const resetPasswordUseCase = new ResetPasswordUseCase(
        userRepository,
        sessionRepository,
        passwordResetTokenRepository,
        passwordHasher,
        refreshTokenHasher,
    )
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
    const addOrganizationMemberController = new AddOrganizationMemberController(
        addOrganizationMemberUseCase,
    )
    const updateMemberRolesController = new UpdateMemberRolesController(
        updateMemberRolesUseCase,
    )
    const removeOrganizationMemberController =
        new RemoveOrganizationMemberController(removeOrganizationMemberUseCase)
    const listUsersController = new ListUsersController(listUsersUseCase)
    const updateUserController = new UpdateUserController(updateUserUseCase)
    const deleteUserController = new DeleteUserController(deleteUserUseCase)
    const listSessionsController = new ListSessionsController(
        listSessionsUseCase,
    )
    const revokeSessionController = new RevokeSessionController(
        revokeSessionUseCase,
    )
    const revokeOtherSessionsController = new RevokeOtherSessionsController(
        revokeOtherSessionsUseCase,
    )
    const changePasswordController = new ChangePasswordController(
        changePasswordUseCase,
    )
    const forgotPasswordController = new ForgotPasswordController(
        forgotPasswordUseCase,
    )
    const resetPasswordController = new ResetPasswordController(
        resetPasswordUseCase,
    )
    const loginController = new LoginController(loginUseCase)
    const refreshSessionController = new RefreshSessionController(
        refreshSessionUseCase,
    )
    const selectOrganizationController = new SelectOrganizationController(
        selectOrganizationUseCase,
    )
    const logoutController = new LogoutController(logoutUseCase)
    const authenticateAccessTokenMiddleware =
        createAuthenticateAccessTokenMiddleware(
            userRepository,
            sessionRepository,
            tokenService,
        )
    const authorizePermissionMiddleware = createAuthorizePermissionMiddleware(
        organizationUserRepository,
        roleRepository,
    )

    return {
        authRouter: createAuthRouter({
            loginController,
            refreshSessionController,
            logoutController,
            selectOrganizationController,
            listSessionsController,
            revokeSessionController,
            revokeOtherSessionsController,
            changePasswordController,
            forgotPasswordController,
            resetPasswordController,
            authenticateAccessTokenMiddleware,
        }),
        organizationsRouter: createOrganizationsRouter({
            createOrganizationController,
            listOrganizationsController,
            listOrganizationMembersController,
            addOrganizationMemberController,
            updateMemberRolesController,
            removeOrganizationMemberController,
            authenticateAccessTokenMiddleware,
            authorizePermissionMiddleware,
        }),
        usersRouter: createUsersRouter({
            createUserController,
            listUsersController,
            updateUserController,
            deleteUserController,
            authenticateAccessTokenMiddleware,
            authorizePermissionMiddleware,
        }),
    }
}
