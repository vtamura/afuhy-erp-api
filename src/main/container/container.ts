import type { Router } from 'express'
import { createAuthModule } from '../../modules/auth'
import { createExampleModule } from '../../modules/example'
import { healthRouter } from '../../shared/presentation/http/routes/health.route'

export type HttpDependencies = {
    healthRouter: Router
    exampleRouter: Router
    authRouter: Router
    organizationsRouter: Router
    usersRouter: Router
}

export function createHttpDependencies(): HttpDependencies {
    const exampleModule = createExampleModule()
    const authModule = createAuthModule()

    return {
        healthRouter,
        exampleRouter: exampleModule.router,
        authRouter: authModule.authRouter,
        organizationsRouter: authModule.organizationsRouter,
        usersRouter: authModule.usersRouter,
    }
}
