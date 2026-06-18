import { NotFoundError } from '../../../../shared/domain/errors'
import type { TaskStatus } from '../../domain/entities/task.entity'
import type { TaskRepository } from '../../domain/repositories/task.repository'
import type { TaskClock } from '../ports/task-clock.port'
import type { TaskResponseDto } from '../dto'
import { toTaskResponseDto } from '../mappers/task-response.mapper'
import { findTaskOrThrow } from './task-use-case.helpers'

export class MoveTaskUseCase {
    constructor(
        private readonly repository: TaskRepository,
        private readonly clock: TaskClock,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
        status: TaskStatus
        position: number
    }): Promise<TaskResponseDto> {
        const current = await findTaskOrThrow(this.repository, input)
        const moved = await this.repository.move({
            id: current.id,
            organizationId: current.organizationId,
            status: input.status,
            position: input.position,
        })
        if (!moved) {
            throw new NotFoundError('Tarefa nao encontrada')
        }
        return toTaskResponseDto(moved, this.clock.now())
    }
}
