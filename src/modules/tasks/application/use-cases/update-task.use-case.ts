import { NotFoundError } from '../../../../shared/domain/errors'
import type { TaskPriority } from '../../domain/entities/task.entity'
import type { TaskRepository } from '../../domain/repositories/task.repository'
import type { TaskClock } from '../ports/task-clock.port'
import type { TaskResponseDto } from '../dto'
import { toTaskResponseDto } from '../mappers/task-response.mapper'
import { findTaskOrThrow, validateAssignee } from './task-use-case.helpers'

export class UpdateTaskUseCase {
    constructor(
        private readonly repository: TaskRepository,
        private readonly clock: TaskClock,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
        title?: string
        description?: string | null
        priority?: TaskPriority
        assigneeOrganizationUserId?: string | null
        dueAt?: Date | null
    }): Promise<TaskResponseDto> {
        const current = await findTaskOrThrow(this.repository, input)
        const data = {
            title: input.title ?? current.title,
            description:
                input.description === undefined
                    ? current.description
                    : input.description,
            priority: input.priority ?? current.priority,
            assigneeOrganizationUserId:
                input.assigneeOrganizationUserId === undefined
                    ? current.assigneeOrganizationUserId
                    : input.assigneeOrganizationUserId,
            dueAt: input.dueAt === undefined ? current.dueAt : input.dueAt,
        }
        await validateAssignee(this.repository, {
            organizationId: current.organizationId,
            assigneeOrganizationUserId: data.assigneeOrganizationUserId,
        })
        const updated = await this.repository.update({
            id: current.id,
            organizationId: current.organizationId,
            data,
        })
        if (!updated) {
            throw new NotFoundError('Tarefa nao encontrada')
        }
        return toTaskResponseDto(updated, this.clock.now())
    }
}
