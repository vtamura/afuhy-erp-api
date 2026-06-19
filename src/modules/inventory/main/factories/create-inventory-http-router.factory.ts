import {
    AddInventoryVariantUseCase,
    CreateInventoryAdjustmentUseCase,
    CreateInventoryMovementUseCase,
    CreateInventoryProductUseCase,
    DeleteInventoryProductUseCase,
    DeleteInventoryVariantUseCase,
    GetInventoryMovementUseCase,
    GetInventoryProductUseCase,
    GetInventorySummaryUseCase,
    ListInventoryMovementsUseCase,
    ListInventoryProductsUseCase,
    ReverseInventoryMovementUseCase,
    UpdateInventoryProductUseCase,
    UpdateInventoryVariantUseCase,
} from '../../application/use-cases'
import {
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
} from '../../presentation/http/controllers'
import { createInventoryRouter } from '../../presentation/http/routes'
import type { InventoryHttpRouterFactoryDependencies } from './inventory-http-router-factory.types'

export function createInventoryHttpRouterFactory(
    deps: InventoryHttpRouterFactoryDependencies,
) {
    const repository = deps.inventoryRepository
    return createInventoryRouter({
        controllers: {
            createProduct: new CreateInventoryProductController(
                new CreateInventoryProductUseCase(repository),
            ),
            listProducts: new ListInventoryProductsController(
                new ListInventoryProductsUseCase(repository),
            ),
            getProduct: new GetInventoryProductController(
                new GetInventoryProductUseCase(repository),
            ),
            updateProduct: new UpdateInventoryProductController(
                new UpdateInventoryProductUseCase(repository),
            ),
            deleteProduct: new DeleteInventoryProductController(
                new DeleteInventoryProductUseCase(repository),
            ),
            addVariant: new AddInventoryVariantController(
                new AddInventoryVariantUseCase(repository),
            ),
            updateVariant: new UpdateInventoryVariantController(
                new UpdateInventoryVariantUseCase(repository),
            ),
            deleteVariant: new DeleteInventoryVariantController(
                new DeleteInventoryVariantUseCase(repository),
            ),
            createMovement: new CreateInventoryMovementController(
                new CreateInventoryMovementUseCase(repository),
            ),
            createAdjustment: new CreateInventoryAdjustmentController(
                new CreateInventoryAdjustmentUseCase(repository),
            ),
            listMovements: new ListInventoryMovementsController(
                new ListInventoryMovementsUseCase(repository),
            ),
            getMovement: new GetInventoryMovementController(
                new GetInventoryMovementUseCase(repository),
            ),
            reverseMovement: new ReverseInventoryMovementController(
                new ReverseInventoryMovementUseCase(repository),
            ),
            getSummary: new GetInventorySummaryController(
                new GetInventorySummaryUseCase(repository),
            ),
        },
        ...deps.middlewares,
    })
}
