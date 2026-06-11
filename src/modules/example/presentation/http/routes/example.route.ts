import { Router } from 'express'
import type { ListExamplesController } from '../controllers'

type CreateExampleRouterParams = {
    listExamplesController: ListExamplesController
}

export function createExampleRouter({
    listExamplesController,
}: CreateExampleRouterParams): Router {
    const router = Router()

    router.get('/examples', listExamplesController.handle)

    return router
}
