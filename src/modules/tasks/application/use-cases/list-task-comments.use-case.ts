import type { TaskRepository } from '../../domain/repositories/task.repository'
import type { TaskCommentResponseDto } from '../dto'
import { toTaskCommentResponseDto } from '../mappers/task-response.mapper'
import { findTaskOrThrow } from './task-use-case.helpers'

export class ListTaskCommentsUseCase {
    constructor(private readonly repository: TaskRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<TaskCommentResponseDto[]> {
        const task = await findTaskOrThrow(this.repository, input)
        const comments = await this.repository.listComments({
            organizationId: task.organizationId,
            taskId: task.id,
        })
        return comments.map(toTaskCommentResponseDto)
    }
}
