import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    CreateRegistryRecordController,
    DeleteRegistryRecordController,
    GetRegistryRecordController,
    ListRegistryRecordsController,
    UpdateRegistryRecordController,
} from '../controllers'

type RegistryResourceControllers = {
    createController: CreateRegistryRecordController
    listController: ListRegistryRecordsController
    getController: GetRegistryRecordController
    updateController: UpdateRegistryRecordController
    deleteController: DeleteRegistryRecordController
}

type CreateRegistryRouterParams = {
    customers: RegistryResourceControllers
    suppliers: RegistryResourceControllers
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}

export function createRegistryRouter({
    customers,
    suppliers,
    authenticateAccessTokenMiddleware,
    authorizePermissionMiddleware,
    authorizeFeatureMiddleware,
}: CreateRegistryRouterParams): Router {
    const router = Router()
    const requireRegistryFeature = authorizeFeatureMiddleware('registry.basic')

    registerResource(router, {
        path: '/registry/customers',
        readPermission: AUTH_PERMISSIONS.REGISTRY_CUSTOMERS_READ,
        managePermission: AUTH_PERMISSIONS.REGISTRY_CUSTOMERS_MANAGE,
        controllers: customers,
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware,
        requireRegistryFeature,
    })
    registerResource(router, {
        path: '/registry/suppliers',
        readPermission: AUTH_PERMISSIONS.REGISTRY_SUPPLIERS_READ,
        managePermission: AUTH_PERMISSIONS.REGISTRY_SUPPLIERS_MANAGE,
        controllers: suppliers,
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware,
        requireRegistryFeature,
    })

    return router
}

function registerResource(
    router: Router,
    params: {
        path: string
        readPermission: string
        managePermission: string
        controllers: RegistryResourceControllers
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        requireRegistryFeature: RequestHandler
    },
) {
    router.post(
        params.path,
        params.authenticateAccessTokenMiddleware,
        params.authorizePermissionMiddleware(params.managePermission),
        params.requireRegistryFeature,
        params.controllers.createController.handle,
    )
    router.get(
        params.path,
        params.authenticateAccessTokenMiddleware,
        params.authorizePermissionMiddleware(params.readPermission),
        params.requireRegistryFeature,
        params.controllers.listController.handle,
    )
    router.get(
        `${params.path}/:id`,
        params.authenticateAccessTokenMiddleware,
        params.authorizePermissionMiddleware(params.readPermission),
        params.requireRegistryFeature,
        params.controllers.getController.handle,
    )
    router.patch(
        `${params.path}/:id`,
        params.authenticateAccessTokenMiddleware,
        params.authorizePermissionMiddleware(params.managePermission),
        params.requireRegistryFeature,
        params.controllers.updateController.handle,
    )
    router.delete(
        `${params.path}/:id`,
        params.authenticateAccessTokenMiddleware,
        params.authorizePermissionMiddleware(params.managePermission),
        params.requireRegistryFeature,
        params.controllers.deleteController.handle,
    )
}
