import type {
    TaskCommentEntity,
    TaskEntity,
    TaskPriority,
    TaskStatus,
} from '../entities/task.entity'

export type TaskCreateData = {
    organizationId: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    assigneeOrganizationUserId: string | null
    createdBy: string
    dueAt: Date | null
}

export type TaskUpdateData = Pick<
    TaskCreateData,
    | 'title'
    | 'description'
    | 'priority'
    | 'assigneeOrganizationUserId'
    | 'dueAt'
>

export type TaskFilters = {
    organizationId: string
    status?: TaskStatus
    priority?: TaskPriority
    assigneeOrganizationUserId?: string
    dueFrom?: Date
    dueTo?: Date
    overdue?: boolean
    search?: string
    now: Date
}

export type TaskPage = {
    items: TaskEntity[]
    total: number
}

export interface TaskRepository {
    create(data: TaskCreateData): Promise<TaskEntity>
    list(
        filters: TaskFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<TaskPage>
    listBoard(organizationId: string): Promise<TaskEntity[]>
    findById(input: {
        id: string
        organizationId: string
    }): Promise<TaskEntity | null>
    update(input: {
        id: string
        organizationId: string
        data: TaskUpdateData
    }): Promise<TaskEntity | null>
    move(input: {
        id: string
        organizationId: string
        status: TaskStatus
        position: number
    }): Promise<TaskEntity | null>
    softDelete(input: { id: string; organizationId: string }): Promise<boolean>
    isActiveMember(input: {
        organizationId: string
        organizationUserId: string
    }): Promise<boolean>
    createComment(input: {
        organizationId: string
        taskId: string
        authorUserId: string
        content: string
    }): Promise<TaskCommentEntity>
    listComments(input: {
        organizationId: string
        taskId: string
    }): Promise<TaskCommentEntity[]>
}
