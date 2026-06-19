import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    AddInventoryVariantController,
    CreateInventoryAdjustmentController,
    CreateInventoryMovementController,
    CreateInventoryProductController,
    DeleteInventoryProductController,
    DeleteInventoryVariantController,
    GetInventoryMovementController,
    GetInventoryProductController,
    GetInventorySummaryController,
    ListInventoryMovementsController,
    ListInventoryProductsController,
    ReverseInventoryMovementController,
    UpdateInventoryProductController,
    UpdateInventoryVariantController,
} from '../controllers'

export function createInventoryRouter(params: {
    controllers: {
        createProduct: CreateInventoryProductController
        listProducts: ListInventoryProductsController
        getProduct: GetInventoryProductController
        updateProduct: UpdateInventoryProductController
        deleteProduct: DeleteInventoryProductController
        addVariant: AddInventoryVariantController
        updateVariant: UpdateInventoryVariantController
        deleteVariant: DeleteInventoryVariantController
        createMovement: CreateInventoryMovementController
        createAdjustment: CreateInventoryAdjustmentController
        listMovements: ListInventoryMovementsController
        getMovement: GetInventoryMovementController
        reverseMovement: ReverseInventoryMovementController
        getSummary: GetInventorySummaryController
    }
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): Router {
    const router = Router()
    const auth = params.authenticateAccessTokenMiddleware
    const feature = params.authorizeFeatureMiddleware('inventory.basic')
    const permission = params.authorizePermissionMiddleware
    const controllers = params.controllers

    router.get(
        '/inventory/summary',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_SUMMARY_READ),
        feature,
        controllers.getSummary.handle,
    )
    router.post(
        '/inventory/adjustments',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_MOVEMENTS_MANAGE),
        feature,
        controllers.createAdjustment.handle,
    )
    router.post(
        '/inventory/movements',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_MOVEMENTS_MANAGE),
        feature,
        controllers.createMovement.handle,
    )
    router.get(
        '/inventory/movements',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_MOVEMENTS_READ),
        feature,
        controllers.listMovements.handle,
    )
    router.post(
        '/inventory/movements/:id/reverse',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_MOVEMENTS_MANAGE),
        feature,
        controllers.reverseMovement.handle,
    )
    router.get(
        '/inventory/movements/:id',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_MOVEMENTS_READ),
        feature,
        controllers.getMovement.handle,
    )
    router.post(
        '/inventory/products',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_PRODUCTS_MANAGE),
        feature,
        controllers.createProduct.handle,
    )
    router.get(
        '/inventory/products',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_PRODUCTS_READ),
        feature,
        controllers.listProducts.handle,
    )
    router.post(
        '/inventory/products/:id/variants',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_PRODUCTS_MANAGE),
        feature,
        controllers.addVariant.handle,
    )
    router.patch(
        '/inventory/products/:id/variants/:variantId',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_PRODUCTS_MANAGE),
        feature,
        controllers.updateVariant.handle,
    )
    router.delete(
        '/inventory/products/:id/variants/:variantId',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_PRODUCTS_MANAGE),
        feature,
        controllers.deleteVariant.handle,
    )
    router.get(
        '/inventory/products/:id',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_PRODUCTS_READ),
        feature,
        controllers.getProduct.handle,
    )
    router.patch(
        '/inventory/products/:id',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_PRODUCTS_MANAGE),
        feature,
        controllers.updateProduct.handle,
    )
    router.delete(
        '/inventory/products/:id',
        auth,
        permission(AUTH_PERMISSIONS.INVENTORY_PRODUCTS_MANAGE),
        feature,
        controllers.deleteProduct.handle,
    )

    return router
}
