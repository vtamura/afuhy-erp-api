export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type TaskMemberReference = {
    organizationUserId: string
    userId: string
    name: string
    email: string
}

export type TaskUserReference = {
    userId: string
    name: string
    email: string
}

export type TaskEntity = {
    id: string
    organizationId: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    assigneeOrganizationUserId: string | null
    assignee: TaskMemberReference | null
    createdBy: string
    creator: TaskUserReference
    dueAt: Date | null
    position: number
    completedAt: Date | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export type TaskCommentEntity = {
    id: string
    organizationId: string
    taskId: string
    authorUserId: string
    author: TaskUserReference
    content: string
    createdAt: Date
}
