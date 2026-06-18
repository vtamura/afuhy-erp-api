export type TaskMemberResponseDto = {
    organizationUserId: string
    userId: string
    name: string
    email: string
}

export type TaskUserResponseDto = {
    userId: string
    name: string
    email: string
}

export type TaskResponseDto = {
    id: string
    organizationId: string
    title: string
    description: string | null
    status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    assigneeOrganizationUserId: string | null
    assignee: TaskMemberResponseDto | null
    createdBy: string
    creator: TaskUserResponseDto
    dueAt: string | null
    position: number
    isOverdue: boolean
    completedAt: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type TaskListResponseDto = {
    items: TaskResponseDto[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

export type TaskBoardResponseDto = {
    columns: Array<{
        status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE'
        items: TaskResponseDto[]
    }>
}

export type TaskCommentResponseDto = {
    id: string
    organizationId: string
    taskId: string
    authorUserId: string
    author: TaskUserResponseDto
    content: string
    createdAt: string
}
