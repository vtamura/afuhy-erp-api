import type { RequestHandler } from 'express'
import type { RegistryRecordRepository } from '../../domain/repositories/registry-record.repository'

export type RegistryHttpRouterFactoryDependencies = {
    registryRecordRepository: RegistryRecordRepository
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
