import type {
    TaskPriority,
    TaskStatus,
} from '../../domain/entities/task.entity'
import type { TaskRepository } from '../../domain/repositories/task.repository'
import type { TaskClock } from '../ports/task-clock.port'
import type { TaskResponseDto } from '../dto'
import { toTaskResponseDto } from '../mappers/task-response.mapper'
import {
    requireTaskOrganization,
    validateAssignee,
} from './task-use-case.helpers'

export class CreateTaskUseCase {
    constructor(
        private readonly repository: TaskRepository,
        private readonly clock: TaskClock,
    ) {}

    async execute(input: {
        organizationId: string | null
        title: string
        description: string | null
        status: TaskStatus
        priority: TaskPriority
        assigneeOrganizationUserId: string | null
        createdBy: string
        dueAt: Date | null
    }): Promise<TaskResponseDto> {
        const organizationId = requireTaskOrganization(input.organizationId)
        await validateAssignee(this.repository, {
            organizationId,
            assigneeOrganizationUserId: input.assigneeOrganizationUserId,
        })
        const task = await this.repository.create({
            ...input,
            organizationId,
        })
        return toTaskResponseDto(task, this.clock.now())
    }
}
