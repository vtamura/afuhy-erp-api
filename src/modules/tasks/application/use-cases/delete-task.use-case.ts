import { NotFoundError } from '../../../../shared/domain/errors'
import type { TaskRepository } from '../../domain/repositories/task.repository'
import { findTaskOrThrow } from './task-use-case.helpers'

export class DeleteTaskUseCase {
    constructor(private readonly repository: TaskRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<void> {
        const current = await findTaskOrThrow(this.repository, input)
        const deleted = await this.repository.softDelete({
            id: current.id,
            organizationId: current.organizationId,
        })
        if (!deleted) {
            throw new NotFoundError('Tarefa nao encontrada')
        }
    }
}
