import type {
    TaskPriority,
    TaskStatus,
} from '../../domain/entities/task.entity'
import type { TaskRepository } from '../../domain/repositories/task.repository'
import type { TaskClock } from '../ports/task-clock.port'
import type { TaskListResponseDto } from '../dto'
import { toTaskResponseDto } from '../mappers/task-response.mapper'
import { requireTaskOrganization } from './task-use-case.helpers'

export class ListTasksUseCase {
    constructor(
        private readonly repository: TaskRepository,
        private readonly clock: TaskClock,
    ) {}

    async execute(input: {
        organizationId: string | null
        status?: TaskStatus
        priority?: TaskPriority
        assigneeOrganizationUserId?: string
        dueFrom?: Date
        dueTo?: Date
        overdue?: boolean
        search?: string
        page: number
        pageSize: number
    }): Promise<TaskListResponseDto> {
        const organizationId = requireTaskOrganization(input.organizationId)
        const now = this.clock.now()
        const result = await this.repository.list(
            { ...input, organizationId, now },
            { page: input.page, pageSize: input.pageSize },
        )
        return {
            items: result.items.map((task) => toTaskResponseDto(task, now)),
            pagination: {
                page: input.page,
                pageSize: input.pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / input.pageSize),
            },
        }
    }
}
