import type { Router } from 'express'
import { createAuthModule } from '../../modules/auth'
import { createBillingModule } from '../../modules/billing'
import { createExampleModule } from '../../modules/example'
import { createFinancialModule } from '../../modules/financial'
import { createRegistryModule } from '../../modules/registry'
import { createTasksModule } from '../../modules/tasks'
import { healthRouter } from '../../shared/presentation/http/routes/health.route'

export type HttpDependencies = {
    healthRouter: Router
    exampleRouter: Router
    authRouter: Router
    organizationsRouter: Router
    usersRouter: Router
    billingRouter: Router
    registryRouter: Router
    financialRouter: Router
    tasksRouter: Router
}

export function createHttpDependencies(): HttpDependencies {
    const exampleModule = createExampleModule()
    const billingModule = createBillingModule()
    const authModule = createAuthModule({
        enforceUserLimitMiddleware: billingModule.enforceUserLimitMiddleware,
    })
    const registryModule = createRegistryModule({
        authorizeFeatureMiddleware: billingModule.authorizeFeatureMiddleware,
    })
    const financialModule = createFinancialModule({
        authorizeFeatureMiddleware: billingModule.authorizeFeatureMiddleware,
    })
    const tasksModule = createTasksModule({
        authorizeFeatureMiddleware: billingModule.authorizeFeatureMiddleware,
    })

    return {
        healthRouter,
        exampleRouter: exampleModule.router,
        authRouter: authModule.authRouter,
        organizationsRouter: authModule.organizationsRouter,
        usersRouter: authModule.usersRouter,
        billingRouter: billingModule.billingRouter,
        registryRouter: registryModule.registryRouter,
        financialRouter: financialModule.financialRouter,
        tasksRouter: tasksModule.tasksRouter,
    }
}
