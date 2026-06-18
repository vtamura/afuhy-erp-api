import type { RequestHandler } from 'express'
import { getDatabaseClient } from '../../shared/infrastructure/database/sequelize.client'
import { PostgresOrganizationUserRepository } from '../auth/infrastructure/repositories/postgres-organization-user.repository'
import { PostgresRoleRepository } from '../auth/infrastructure/repositories/postgres-role.repository'
import { PostgresSessionRepository } from '../auth/infrastructure/repositories/postgres-session.repository'
import { PostgresUserRepository } from '../auth/infrastructure/repositories/postgres-user.repository'
import { JwtTokenService } from '../auth/infrastructure/security/jwt-token.service'
import { createAuthenticateAccessTokenMiddleware } from '../auth/presentation/http/middlewares/authenticate-access-token.middleware'
import { createAuthorizePermissionMiddleware } from '../auth/presentation/http/middlewares/authorize-permission.middleware'
import { SystemTaskClock } from './infrastructure/clock/system-task-clock'
import { PostgresTaskRepository } from './infrastructure/repositories/postgres-task.repository'
import { createTasksHttpRouterFactory } from './main/factories'
import { createTasksRouter } from './presentation/http/routes'

export type TasksModule = {
    tasksRouter: ReturnType<typeof createTasksRouter>
}

export function createTasksModule(params: {
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): TasksModule {
    const databaseClient = getDatabaseClient()
    const taskRepository = new PostgresTaskRepository(databaseClient)
    const authenticateAccessTokenMiddleware =
        createAuthenticateAccessTokenMiddleware(
            new PostgresUserRepository(databaseClient),
            new PostgresSessionRepository(databaseClient),
            new JwtTokenService(),
        )
    const authorizePermissionMiddleware = createAuthorizePermissionMiddleware(
        new PostgresOrganizationUserRepository(databaseClient),
        new PostgresRoleRepository(databaseClient),
    )

    return {
        tasksRouter: createTasksHttpRouterFactory({
            taskRepository,
            taskClock: new SystemTaskClock(),
            middlewares: {
                authenticateAccessTokenMiddleware,
                authorizePermissionMiddleware,
                authorizeFeatureMiddleware: params.authorizeFeatureMiddleware,
            },
        }),
    }
}
