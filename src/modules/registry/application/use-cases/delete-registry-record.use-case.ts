import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { RegistryRecordType } from '../../domain/entities/registry-record.entity'
import type { RegistryRecordRepository } from '../../domain/repositories/registry-record.repository'

type DeleteRegistryRecordUseCaseInput = {
    type: RegistryRecordType
    id: string
    organizationId: string | null
}

export class DeleteRegistryRecordUseCase {
    constructor(
        private readonly registryRecordRepository: RegistryRecordRepository,
    ) {}

    async execute(input: DeleteRegistryRecordUseCaseInput): Promise<void> {
        if (!input.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const deleted = await this.registryRecordRepository.softDelete({
            type: input.type,
            id: input.id,
            organizationId: input.organizationId,
        })

        if (!deleted) {
            throw new NotFoundError('Cadastro nao encontrado')
        }
    }
}
