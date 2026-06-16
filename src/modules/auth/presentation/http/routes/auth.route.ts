import { Router } from 'express'
import type {
    LoginController,
    LogoutController,
    RefreshSessionController,
    SelectOrganizationController,
} from '../controllers'

type CreateAuthRouterParams = {
    loginController: LoginController
    refreshSessionController: RefreshSessionController
    logoutController: LogoutController
    selectOrganizationController: SelectOrganizationController
}

export function createAuthRouter({
    loginController,
    refreshSessionController,
    logoutController,
    selectOrganizationController,
}: CreateAuthRouterParams): Router {
    const router = Router()

    router.post('/auth/login', loginController.handle)
    router.post('/auth/refresh', refreshSessionController.handle)
    router.post('/auth/logout', logoutController.handle)
    router.post(
        '/auth/select-organization',
        selectOrganizationController.handle,
    )

    return router
}
