import {
    CancelFinancialTransactionUseCase,
    CreateFinancialAccountUseCase,
    CreateFinancialCategoryUseCase,
    CreateFinancialTransactionUseCase,
    DeleteFinancialAccountUseCase,
    DeleteFinancialCategoryUseCase,
    DeleteFinancialTransactionUseCase,
    GetFinancialAccountUseCase,
    GetFinancialCategoryUseCase,
    GetFinancialDashboardUseCase,
    GetFinancialTransactionUseCase,
    ListFinancialAccountsUseCase,
    ListFinancialCategoriesUseCase,
    ListFinancialTransactionsUseCase,
    PayFinancialTransactionUseCase,
    UpdateFinancialAccountUseCase,
    UpdateFinancialCategoryUseCase,
    UpdateFinancialTransactionUseCase,
} from '../../application/use-cases'
import {
    CancelFinancialTransactionController,
    CreateFinancialAccountController,
    CreateFinancialCategoryController,
    CreateFinancialTransactionController,
    DeleteFinancialAccountController,
    DeleteFinancialCategoryController,
    DeleteFinancialTransactionController,
    GetFinancialAccountController,
    GetFinancialCategoryController,
    GetFinancialDashboardController,
    GetFinancialTransactionController,
    ListFinancialAccountsController,
    ListFinancialCategoriesController,
    ListFinancialTransactionsController,
    PayFinancialTransactionController,
    UpdateFinancialAccountController,
    UpdateFinancialCategoryController,
    UpdateFinancialTransactionController,
} from '../../presentation/http/controllers'
import { createFinancialRouter } from '../../presentation/http/routes'
import type { FinancialHttpRouterFactoryDependencies } from './financial-http-router-factory.types'

export function createFinancialHttpRouterFactory(
    deps: FinancialHttpRouterFactoryDependencies,
) {
    const repository = deps.financialRepository

    return createFinancialRouter({
        controllers: {
            dashboard: new GetFinancialDashboardController(
                new GetFinancialDashboardUseCase(
                    deps.financialDashboardRepository,
                    deps.financialClock,
                ),
            ),
            accounts: {
                create: new CreateFinancialAccountController(
                    new CreateFinancialAccountUseCase(repository),
                ),
                list: new ListFinancialAccountsController(
                    new ListFinancialAccountsUseCase(repository),
                ),
                get: new GetFinancialAccountController(
                    new GetFinancialAccountUseCase(repository),
                ),
                update: new UpdateFinancialAccountController(
                    new UpdateFinancialAccountUseCase(repository),
                ),
                delete: new DeleteFinancialAccountController(
                    new DeleteFinancialAccountUseCase(repository),
                ),
            },
            categories: {
                create: new CreateFinancialCategoryController(
                    new CreateFinancialCategoryUseCase(repository),
                ),
                list: new ListFinancialCategoriesController(
                    new ListFinancialCategoriesUseCase(repository),
                ),
                get: new GetFinancialCategoryController(
                    new GetFinancialCategoryUseCase(repository),
                ),
                update: new UpdateFinancialCategoryController(
                    new UpdateFinancialCategoryUseCase(repository),
                ),
                delete: new DeleteFinancialCategoryController(
                    new DeleteFinancialCategoryUseCase(repository),
                ),
            },
            transactions: {
                create: new CreateFinancialTransactionController(
                    new CreateFinancialTransactionUseCase(repository),
                ),
                list: new ListFinancialTransactionsController(
                    new ListFinancialTransactionsUseCase(repository),
                ),
                get: new GetFinancialTransactionController(
                    new GetFinancialTransactionUseCase(repository),
                ),
                update: new UpdateFinancialTransactionController(
                    new UpdateFinancialTransactionUseCase(repository),
                ),
                pay: new PayFinancialTransactionController(
                    new PayFinancialTransactionUseCase(repository),
                ),
                cancel: new CancelFinancialTransactionController(
                    new CancelFinancialTransactionUseCase(repository),
                ),
                delete: new DeleteFinancialTransactionController(
                    new DeleteFinancialTransactionUseCase(repository),
                ),
            },
        },
        ...deps.middlewares,
    })
}
