import { Router, type RequestHandler } from 'express'
import type {
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
} from '../controllers'

type CreateAuthRouterParams = {
    loginController: LoginController
    refreshSessionController: RefreshSessionController
    logoutController: LogoutController
    selectOrganizationController: SelectOrganizationController
    listSessionsController: ListSessionsController
    revokeSessionController: RevokeSessionController
    revokeOtherSessionsController: RevokeOtherSessionsController
    changePasswordController: ChangePasswordController
    forgotPasswordController: ForgotPasswordController
    resetPasswordController: ResetPasswordController
    acceptOrganizationInvitationController: AcceptOrganizationInvitationController
    authenticateAccessTokenMiddleware: RequestHandler
}

export function createAuthRouter({
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
    acceptOrganizationInvitationController,
    authenticateAccessTokenMiddleware,
}: CreateAuthRouterParams): Router {
    const router = Router()

    router.post('/auth/login', loginController.handle)
    router.post('/auth/refresh', refreshSessionController.handle)
    router.post('/auth/logout', logoutController.handle)
    router.get(
        '/auth/sessions',
        authenticateAccessTokenMiddleware,
        listSessionsController.handle,
    )
    router.delete(
        '/auth/sessions/others',
        authenticateAccessTokenMiddleware,
        revokeOtherSessionsController.handle,
    )
    router.delete(
        '/auth/sessions/:id',
        authenticateAccessTokenMiddleware,
        revokeSessionController.handle,
    )
    router.post(
        '/auth/change-password',
        authenticateAccessTokenMiddleware,
        changePasswordController.handle,
    )
    router.post('/auth/forgot-password', forgotPasswordController.handle)
    router.post('/auth/reset-password', resetPasswordController.handle)
    router.post(
        '/auth/invitations/accept',
        acceptOrganizationInvitationController.handle,
    )
    router.post(
        '/auth/select-organization',
        selectOrganizationController.handle,
    )

    return router
}
