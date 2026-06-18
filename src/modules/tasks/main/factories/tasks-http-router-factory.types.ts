import type { RequestHandler } from 'express'
import type { TaskClock } from '../../application/ports/task-clock.port'
import type { TaskRepository } from '../../domain/repositories/task.repository'

export type TasksHttpRouterFactoryDependencies = {
    taskRepository: TaskRepository
    taskClock: TaskClock
    middlewares: {
        authenticateAccessTokenMiddleware: RequestHandler
        authorizePermissionMiddleware: (
            permissionCode: string,
        ) => RequestHandler
        authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
    }
}
