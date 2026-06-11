import type { Router } from 'express'
import { createExampleModule } from '../../modules/example'
import { healthRouter } from '../../shared/presentation/http/routes/health.route'

export type HttpDependencies = {
  healthRouter: Router
  exampleRouter: Router
}

export function createHttpDependencies(): HttpDependencies {
  const exampleModule = createExampleModule()

  return {
    healthRouter,
    exampleRouter: exampleModule.router,
  }
}
