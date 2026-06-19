import type { RequestHandler } from 'express'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'

export type InventoryHttpRouterFactoryDependencies = {
    inventoryRepository: InventoryRepository
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
