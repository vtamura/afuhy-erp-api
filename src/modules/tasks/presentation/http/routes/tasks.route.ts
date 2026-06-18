import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    CreateTaskCommentController,
    CreateTaskController,
    DeleteTaskController,
    GetTaskController,
    ListTaskBoardController,
    ListTaskCommentsController,
    ListTasksController,
    MoveTaskController,
    UpdateTaskController,
} from '../controllers'

export function createTasksRouter(params: {
    controllers: {
        create: CreateTaskController
        list: ListTasksController
        board: ListTaskBoardController
        get: GetTaskController
        update: UpdateTaskController
        move: MoveTaskController
        delete: DeleteTaskController
        createComment: CreateTaskCommentController
        listComments: ListTaskCommentsController
    }
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): Router {
    const router = Router()
    const auth = params.authenticateAccessTokenMiddleware
    const feature = params.authorizeFeatureMiddleware('tasks.basic')
    const read = params.authorizePermissionMiddleware(
        AUTH_PERMISSIONS.TASKS_READ,
    )
    const manage = params.authorizePermissionMiddleware(
        AUTH_PERMISSIONS.TASKS_MANAGE,
    )
    const controllers = params.controllers

    router.post('/tasks', auth, manage, feature, controllers.create.handle)
    router.get('/tasks', auth, read, feature, controllers.list.handle)
    router.get('/tasks/board', auth, read, feature, controllers.board.handle)
    router.get('/tasks/:id', auth, read, feature, controllers.get.handle)
    router.patch('/tasks/:id', auth, manage, feature, controllers.update.handle)
    router.post(
        '/tasks/:id/move',
        auth,
        manage,
        feature,
        controllers.move.handle,
    )
    router.delete(
        '/tasks/:id',
        auth,
        manage,
        feature,
        controllers.delete.handle,
    )
    router.get(
        '/tasks/:id/comments',
        auth,
        read,
        feature,
        controllers.listComments.handle,
    )
    router.post(
        '/tasks/:id/comments',
        auth,
        manage,
        feature,
        controllers.createComment.handle,
    )

    return router
}
