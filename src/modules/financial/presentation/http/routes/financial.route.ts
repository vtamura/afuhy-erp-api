import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
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
} from '../controllers'

type FinancialControllers = {
    dashboard: GetFinancialDashboardController
    accounts: {
        create: CreateFinancialAccountController
        list: ListFinancialAccountsController
        get: GetFinancialAccountController
        update: UpdateFinancialAccountController
        delete: DeleteFinancialAccountController
    }
    categories: {
        create: CreateFinancialCategoryController
        list: ListFinancialCategoriesController
        get: GetFinancialCategoryController
        update: UpdateFinancialCategoryController
        delete: DeleteFinancialCategoryController
    }
    transactions: {
        create: CreateFinancialTransactionController
        list: ListFinancialTransactionsController
        get: GetFinancialTransactionController
        update: UpdateFinancialTransactionController
        pay: PayFinancialTransactionController
        cancel: CancelFinancialTransactionController
        delete: DeleteFinancialTransactionController
    }
}

export function createFinancialRouter(params: {
    controllers: FinancialControllers
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): Router {
    const router = Router()
    const auth = params.authenticateAccessTokenMiddleware
    const feature = params.authorizeFeatureMiddleware('financial.basic')
    const permission = params.authorizePermissionMiddleware
    const controllers = params.controllers

    router.get(
        '/financial/dashboard',
        auth,
        permission(AUTH_PERMISSIONS.FINANCIAL_DASHBOARD_READ),
        feature,
        controllers.dashboard.handle,
    )

    registerCrud(router, {
        path: '/financial/accounts',
        auth,
        feature,
        read: permission(AUTH_PERMISSIONS.FINANCIAL_ACCOUNTS_READ),
        manage: permission(AUTH_PERMISSIONS.FINANCIAL_ACCOUNTS_MANAGE),
        controllers: controllers.accounts,
    })
    registerCrud(router, {
        path: '/financial/categories',
        auth,
        feature,
        read: permission(AUTH_PERMISSIONS.FINANCIAL_CATEGORIES_READ),
        manage: permission(AUTH_PERMISSIONS.FINANCIAL_CATEGORIES_MANAGE),
        controllers: controllers.categories,
    })

    const transactionPath = '/financial/transactions'
    const transactionRead = permission(
        AUTH_PERMISSIONS.FINANCIAL_TRANSACTIONS_READ,
    )
    const transactionManage = permission(
        AUTH_PERMISSIONS.FINANCIAL_TRANSACTIONS_MANAGE,
    )
    router.post(
        transactionPath,
        auth,
        transactionManage,
        feature,
        controllers.transactions.create.handle,
    )
    router.get(
        transactionPath,
        auth,
        transactionRead,
        feature,
        controllers.transactions.list.handle,
    )
    router.get(
        `${transactionPath}/:id`,
        auth,
        transactionRead,
        feature,
        controllers.transactions.get.handle,
    )
    router.patch(
        `${transactionPath}/:id`,
        auth,
        transactionManage,
        feature,
        controllers.transactions.update.handle,
    )
    router.post(
        `${transactionPath}/:id/pay`,
        auth,
        transactionManage,
        feature,
        controllers.transactions.pay.handle,
    )
    router.post(
        `${transactionPath}/:id/cancel`,
        auth,
        transactionManage,
        feature,
        controllers.transactions.cancel.handle,
    )
    router.delete(
        `${transactionPath}/:id`,
        auth,
        transactionManage,
        feature,
        controllers.transactions.delete.handle,
    )

    return router
}

function registerCrud(
    router: Router,
    params: {
        path: string
        auth: RequestHandler
        feature: RequestHandler
        read: RequestHandler
        manage: RequestHandler
        controllers: {
            create: { handle: RequestHandler }
            list: { handle: RequestHandler }
            get: { handle: RequestHandler }
            update: { handle: RequestHandler }
            delete: { handle: RequestHandler }
        }
    },
) {
    router.post(
        params.path,
        params.auth,
        params.manage,
        params.feature,
        params.controllers.create.handle,
    )
    router.get(
        params.path,
        params.auth,
        params.read,
        params.feature,
        params.controllers.list.handle,
    )
    router.get(
        `${params.path}/:id`,
        params.auth,
        params.read,
        params.feature,
        params.controllers.get.handle,
    )
    router.patch(
        `${params.path}/:id`,
        params.auth,
        params.manage,
        params.feature,
        params.controllers.update.handle,
    )
    router.delete(
        `${params.path}/:id`,
        params.auth,
        params.manage,
        params.feature,
        params.controllers.delete.handle,
    )
}
