import {
    AcceptOrganizationInvitationUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    ListSessionsUseCase,
    LoginUseCase,
    LogoutUseCase,
    RefreshSessionUseCase,
    ResetPasswordUseCase,
    RevokeOtherSessionsUseCase,
    RevokeSessionUseCase,
    SelectOrganizationUseCase,
} from '../../application/use-cases'
import {
    AcceptOrganizationInvitationController,
    ChangePasswordController,
    ForgotPasswordController,
    ListSessionsController,
    LoginController,
    LogoutController,
    RefreshSessionController,
    ResetPasswordController,
    RevokeOtherSessionsController,
    RevokeSessionController,
    SelectOrganizationController,
} from '../../presentation/http/controllers'
import { createAuthRouter } from '../../presentation/http/routes'
import type { AuthHttpRouterFactoryDependencies } from './auth-http-router-factory.types'

export function createAuthHttpRouterFactory(
    deps: AuthHttpRouterFactoryDependencies,
) {
    const {
        organizationInvitationRepository,
        organizationRepository,
        organizationUserRepository,
        passwordResetTokenRepository,
        sessionRepository,
        userRepository,
    } = deps.repositories
    const {
        passwordHasher,
        refreshTokenHasher,
        secureTokenGenerator,
        tokenService,
    } = deps.security
    const { authenticateAccessTokenMiddleware } = deps.middlewares

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
    const acceptOrganizationInvitationUseCase =
        new AcceptOrganizationInvitationUseCase(
            organizationRepository,
            organizationInvitationRepository,
            organizationUserRepository,
            deps.repositories.roleRepository,
            userRepository,
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

    return createAuthRouter({
        loginController: new LoginController(loginUseCase),
        refreshSessionController: new RefreshSessionController(
            refreshSessionUseCase,
        ),
        logoutController: new LogoutController(logoutUseCase),
        selectOrganizationController: new SelectOrganizationController(
            selectOrganizationUseCase,
        ),
        listSessionsController: new ListSessionsController(listSessionsUseCase),
        revokeSessionController: new RevokeSessionController(
            revokeSessionUseCase,
        ),
        revokeOtherSessionsController: new RevokeOtherSessionsController(
            revokeOtherSessionsUseCase,
        ),
        changePasswordController: new ChangePasswordController(
            changePasswordUseCase,
        ),
        forgotPasswordController: new ForgotPasswordController(
            forgotPasswordUseCase,
        ),
        resetPasswordController: new ResetPasswordController(
            resetPasswordUseCase,
        ),
        acceptOrganizationInvitationController:
            new AcceptOrganizationInvitationController(
                acceptOrganizationInvitationUseCase,
            ),
        authenticateAccessTokenMiddleware,
    })
}
