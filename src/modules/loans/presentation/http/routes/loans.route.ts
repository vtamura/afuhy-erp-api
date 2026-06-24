import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    CancelLoanChargeController,
    CancelLoanController,
    CreateLoanChargeController,
    CreateLoanController,
    CreateLoanOccurrenceController,
    CreateLoanReturnController,
    GetLoanController,
    ListLoansController,
    ReleaseLoanController,
    UpdateLoanController,
} from '../controllers'

export function createLoansRouter(params: {
    controllers: {
        create: CreateLoanController
        list: ListLoansController
        get: GetLoanController
        update: UpdateLoanController
        release: ReleaseLoanController
        cancel: CancelLoanController
        createReturn: CreateLoanReturnController
        createOccurrence: CreateLoanOccurrenceController
        createCharge: CreateLoanChargeController
        cancelCharge: CancelLoanChargeController
    }
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): Router {
    const router = Router()
    const auth = params.authenticateAccessTokenMiddleware
    const feature = params.authorizeFeatureMiddleware('loans.basic')
    const permission = params.authorizePermissionMiddleware
    const read = permission(AUTH_PERMISSIONS.LOANS_READ)
    const manage = permission(AUTH_PERMISSIONS.LOANS_MANAGE)

    router.post(
        '/loans',
        auth,
        manage,
        feature,
        params.controllers.create.handle,
    )
    router.get('/loans', auth, read, feature, params.controllers.list.handle)
    router.get('/loans/:id', auth, read, feature, params.controllers.get.handle)
    router.patch(
        '/loans/:id',
        auth,
        manage,
        feature,
        params.controllers.update.handle,
    )
    router.post(
        '/loans/:id/release',
        auth,
        manage,
        feature,
        params.controllers.release.handle,
    )
    router.post(
        '/loans/:id/cancel',
        auth,
        manage,
        feature,
        params.controllers.cancel.handle,
    )
    router.post(
        '/loans/:id/returns',
        auth,
        manage,
        feature,
        params.controllers.createReturn.handle,
    )
    router.post(
        '/loans/:id/occurrences',
        auth,
        manage,
        feature,
        params.controllers.createOccurrence.handle,
    )
    router.post(
        '/loans/:id/charges',
        auth,
        manage,
        feature,
        params.controllers.createCharge.handle,
    )
    router.post(
        '/loans/:id/charges/:chargeId/cancel',
        auth,
        manage,
        feature,
        params.controllers.cancelCharge.handle,
    )
    return router
}
