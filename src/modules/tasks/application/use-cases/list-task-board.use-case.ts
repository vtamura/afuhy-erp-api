import type { TaskStatus } from '../../domain/entities/task.entity'
import type { TaskRepository } from '../../domain/repositories/task.repository'
import type { TaskClock } from '../ports/task-clock.port'
import type { TaskBoardResponseDto } from '../dto'
import { toTaskResponseDto } from '../mappers/task-response.mapper'
import { requireTaskOrganization } from './task-use-case.helpers'

const statuses: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE']

export class ListTaskBoardUseCase {
    constructor(
        private readonly repository: TaskRepository,
        private readonly clock: TaskClock,
    ) {}

    async execute(input: {
        organizationId: string | null
    }): Promise<TaskBoardResponseDto> {
        const organizationId = requireTaskOrganization(input.organizationId)
        const now = this.clock.now()
        const tasks = await this.repository.listBoard(organizationId)
        return {
            columns: statuses.map((status) => ({
                status,
                items: tasks
                    .filter((task) => task.status === status)
                    .sort((a, b) => a.position - b.position)
                    .map((task) => toTaskResponseDto(task, now)),
            })),
        }
    }
}
