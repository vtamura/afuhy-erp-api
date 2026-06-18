import {
    CreateTaskCommentUseCase,
    CreateTaskUseCase,
    DeleteTaskUseCase,
    GetTaskUseCase,
    ListTaskBoardUseCase,
    ListTaskCommentsUseCase,
    ListTasksUseCase,
    MoveTaskUseCase,
    UpdateTaskUseCase,
} from '../../application/use-cases'
import {
    CreateTaskCommentController,
    CreateTaskController,
    DeleteTaskController,
    GetTaskController,
    ListTaskBoardController,
    ListTaskCommentsController,
    ListTasksController,
    MoveTaskController,
    UpdateTaskController,
} from '../../presentation/http/controllers'
import { createTasksRouter } from '../../presentation/http/routes'
import type { TasksHttpRouterFactoryDependencies } from './tasks-http-router-factory.types'

export function createTasksHttpRouterFactory(
    deps: TasksHttpRouterFactoryDependencies,
) {
    const repository = deps.taskRepository
    const clock = deps.taskClock

    return createTasksRouter({
        controllers: {
            create: new CreateTaskController(
                new CreateTaskUseCase(repository, clock),
            ),
            list: new ListTasksController(
                new ListTasksUseCase(repository, clock),
            ),
            board: new ListTaskBoardController(
                new ListTaskBoardUseCase(repository, clock),
            ),
            get: new GetTaskController(new GetTaskUseCase(repository, clock)),
            update: new UpdateTaskController(
                new UpdateTaskUseCase(repository, clock),
            ),
            move: new MoveTaskController(
                new MoveTaskUseCase(repository, clock),
            ),
            delete: new DeleteTaskController(new DeleteTaskUseCase(repository)),
            createComment: new CreateTaskCommentController(
                new CreateTaskCommentUseCase(repository),
            ),
            listComments: new ListTaskCommentsController(
                new ListTaskCommentsUseCase(repository),
            ),
        },
        ...deps.middlewares,
    })
}
