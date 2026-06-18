import {
    CancelFinancialTransactionUseCase,
    CancelFinancialObligationUseCase,
    CreateFinancialAccountUseCase,
    CreateFinancialCategoryUseCase,
    CreateFinancialTransactionUseCase,
    CreateFinancialObligationUseCase,
    DeleteFinancialAccountUseCase,
    DeleteFinancialCategoryUseCase,
    DeleteFinancialTransactionUseCase,
    DeleteFinancialObligationUseCase,
    GetFinancialAccountUseCase,
    GetFinancialCategoryUseCase,
    GetFinancialDashboardUseCase,
    GetFinancialTransactionUseCase,
    GetFinancialObligationUseCase,
    ListFinancialAccountsUseCase,
    ListFinancialCategoriesUseCase,
    ListFinancialTransactionsUseCase,
    ListFinancialObligationsUseCase,
    PayFinancialTransactionUseCase,
    SettleFinancialObligationUseCase,
    UpdateFinancialAccountUseCase,
    UpdateFinancialCategoryUseCase,
    UpdateFinancialTransactionUseCase,
    UpdateFinancialObligationUseCase,
} from '../../application/use-cases'
import {
    CancelFinancialTransactionController,
    CancelFinancialObligationController,
    CreateFinancialAccountController,
    CreateFinancialCategoryController,
    CreateFinancialTransactionController,
    CreateFinancialObligationController,
    DeleteFinancialAccountController,
    DeleteFinancialCategoryController,
    DeleteFinancialTransactionController,
    DeleteFinancialObligationController,
    GetFinancialAccountController,
    GetFinancialCategoryController,
    GetFinancialDashboardController,
    GetFinancialTransactionController,
    GetFinancialObligationController,
    ListFinancialAccountsController,
    ListFinancialCategoriesController,
    ListFinancialTransactionsController,
    ListFinancialObligationsController,
    PayFinancialTransactionController,
    SettleFinancialObligationController,
    UpdateFinancialAccountController,
    UpdateFinancialCategoryController,
    UpdateFinancialTransactionController,
    UpdateFinancialObligationController,
} from '../../presentation/http/controllers'
import { createFinancialRouter } from '../../presentation/http/routes'
import type { FinancialHttpRouterFactoryDependencies } from './financial-http-router-factory.types'

export function createFinancialHttpRouterFactory(
    deps: FinancialHttpRouterFactoryDependencies,
) {
    const repository = deps.financialRepository
    const createObligationControllers = (kind: 'payable' | 'receivable') => ({
        create: new CreateFinancialObligationController(
            new CreateFinancialObligationUseCase(
                repository,
                deps.financialObligationRepository,
                deps.financialClock,
                kind,
            ),
        ),
        list: new ListFinancialObligationsController(
            new ListFinancialObligationsUseCase(
                deps.financialObligationRepository,
                deps.financialClock,
                kind,
            ),
        ),
        get: new GetFinancialObligationController(
            new GetFinancialObligationUseCase(
                deps.financialObligationRepository,
                deps.financialClock,
                kind,
            ),
        ),
        update: new UpdateFinancialObligationController(
            new UpdateFinancialObligationUseCase(
                repository,
                deps.financialObligationRepository,
                deps.financialClock,
                kind,
            ),
        ),
        settle: new SettleFinancialObligationController(
            new SettleFinancialObligationUseCase(
                repository,
                deps.financialObligationRepository,
                deps.financialClock,
                kind,
            ),
        ),
        cancel: new CancelFinancialObligationController(
            new CancelFinancialObligationUseCase(
                repository,
                deps.financialObligationRepository,
                deps.financialClock,
                kind,
            ),
        ),
        delete: new DeleteFinancialObligationController(
            new DeleteFinancialObligationUseCase(
                repository,
                deps.financialObligationRepository,
                deps.financialClock,
                kind,
            ),
        ),
    })

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
                    new PayFinancialTransactionUseCase(
                        repository,
                        deps.financialClock,
                    ),
                ),
                cancel: new CancelFinancialTransactionController(
                    new CancelFinancialTransactionUseCase(repository),
                ),
                delete: new DeleteFinancialTransactionController(
                    new DeleteFinancialTransactionUseCase(repository),
                ),
            },
            payables: createObligationControllers('payable'),
            receivables: createObligationControllers('receivable'),
        },
        ...deps.middlewares,
    })
}
