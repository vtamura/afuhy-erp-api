import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { TaskEntity } from '../../domain/entities/task.entity'
import type { TaskRepository } from '../../domain/repositories/task.repository'

export function requireTaskOrganization(organizationId: string | null): string {
    if (!organizationId) {
        throw new ForbiddenError('Organizacao nao selecionada')
    }
    return organizationId
}

export async function findTaskOrThrow(
    repository: TaskRepository,
    input: { id: string; organizationId: string | null },
): Promise<TaskEntity> {
    const organizationId = requireTaskOrganization(input.organizationId)
    const task = await repository.findById({ id: input.id, organizationId })
    if (!task) {
        throw new NotFoundError('Tarefa nao encontrada')
    }
    return task
}

export async function validateAssignee(
    repository: TaskRepository,
    input: {
        organizationId: string
        assigneeOrganizationUserId: string | null
    },
): Promise<void> {
    if (
        input.assigneeOrganizationUserId &&
        !(await repository.isActiveMember({
            organizationId: input.organizationId,
            organizationUserId: input.assigneeOrganizationUserId,
        }))
    ) {
        throw new NotFoundError(
            'Responsavel ativo nao encontrado na organizacao',
        )
    }
}
