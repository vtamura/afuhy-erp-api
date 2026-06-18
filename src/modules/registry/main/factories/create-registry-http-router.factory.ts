import {
    CreateRegistryRecordUseCase,
    DeleteRegistryRecordUseCase,
    GetRegistryRecordUseCase,
    ListRegistryRecordsUseCase,
    UpdateRegistryRecordUseCase,
} from '../../application/use-cases'
import {
    CreateRegistryRecordController,
    DeleteRegistryRecordController,
    GetRegistryRecordController,
    ListRegistryRecordsController,
    UpdateRegistryRecordController,
} from '../../presentation/http/controllers'
import { createRegistryRouter } from '../../presentation/http/routes'
import type { RegistryHttpRouterFactoryDependencies } from './registry-http-router-factory.types'

export function createRegistryHttpRouterFactory(
    deps: RegistryHttpRouterFactoryDependencies,
) {
    const {
        registryRecordRepository,
        middlewares: {
            authenticateAccessTokenMiddleware,
            authorizePermissionMiddleware,
            authorizeFeatureMiddleware,
        },
    } = deps

    const createUseCase = new CreateRegistryRecordUseCase(
        registryRecordRepository,
    )
    const listUseCase = new ListRegistryRecordsUseCase(registryRecordRepository)
    const getUseCase = new GetRegistryRecordUseCase(registryRecordRepository)
    const updateUseCase = new UpdateRegistryRecordUseCase(
        registryRecordRepository,
    )
    const deleteUseCase = new DeleteRegistryRecordUseCase(
        registryRecordRepository,
    )

    return createRegistryRouter({
        customers: {
            createController: new CreateRegistryRecordController(
                'customer',
                createUseCase,
            ),
            listController: new ListRegistryRecordsController(
                'customer',
                listUseCase,
            ),
            getController: new GetRegistryRecordController(
                'customer',
                getUseCase,
            ),
            updateController: new UpdateRegistryRecordController(
                'customer',
                updateUseCase,
            ),
            deleteController: new DeleteRegistryRecordController(
                'customer',
                deleteUseCase,
            ),
        },
        suppliers: {
            createController: new CreateRegistryRecordController(
                'supplier',
                createUseCase,
            ),
            listController: new ListRegistryRecordsController(
                'supplier',
                listUseCase,
            ),
            getController: new GetRegistryRecordController(
                'supplier',
                getUseCase,
            ),
            updateController: new UpdateRegistryRecordController(
                'supplier',
                updateUseCase,
            ),
            deleteController: new DeleteRegistryRecordController(
                'supplier',
                deleteUseCase,
            ),
        },
        authenticateAccessTokenMiddleware,
        authorizePermissionMiddleware,
        authorizeFeatureMiddleware,
    })
}
