import type { TaskRepository } from '../../domain/repositories/task.repository'
import type { TaskCommentResponseDto } from '../dto'
import { toTaskCommentResponseDto } from '../mappers/task-response.mapper'
import { findTaskOrThrow } from './task-use-case.helpers'

export class CreateTaskCommentUseCase {
    constructor(private readonly repository: TaskRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
        authorUserId: string
        content: string
    }): Promise<TaskCommentResponseDto> {
        const task = await findTaskOrThrow(this.repository, input)
        return toTaskCommentResponseDto(
            await this.repository.createComment({
                organizationId: task.organizationId,
                taskId: task.id,
                authorUserId: input.authorUserId,
                content: input.content,
            }),
        )
    }
}
