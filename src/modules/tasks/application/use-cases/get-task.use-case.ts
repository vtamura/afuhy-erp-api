import type { TaskRepository } from '../../domain/repositories/task.repository'
import type { TaskClock } from '../ports/task-clock.port'
import type { TaskResponseDto } from '../dto'
import { toTaskResponseDto } from '../mappers/task-response.mapper'
import { findTaskOrThrow } from './task-use-case.helpers'

export class GetTaskUseCase {
    constructor(
        private readonly repository: TaskRepository,
        private readonly clock: TaskClock,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<TaskResponseDto> {
        return toTaskResponseDto(
            await findTaskOrThrow(this.repository, input),
            this.clock.now(),
        )
    }
}
