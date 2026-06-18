import type {
    TaskCommentEntity,
    TaskEntity,
} from '../../domain/entities/task.entity'
import type { TaskCommentResponseDto, TaskResponseDto } from '../dto'

export function toTaskResponseDto(
    task: TaskEntity,
    now = new Date(),
): TaskResponseDto {
    return {
        ...task,
        dueAt: task.dueAt?.toISOString() ?? null,
        isOverdue:
            task.status !== 'DONE' &&
            task.dueAt !== null &&
            task.dueAt.getTime() < now.getTime(),
        completedAt: task.completedAt?.toISOString() ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        deletedAt: task.deletedAt?.toISOString() ?? null,
    }
}

export function toTaskCommentResponseDto(
    comment: TaskCommentEntity,
): TaskCommentResponseDto {
    return {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
    }
}
