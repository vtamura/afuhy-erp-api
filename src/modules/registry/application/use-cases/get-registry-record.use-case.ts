import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { RegistryRecordType } from '../../domain/entities/registry-record.entity'
import type { RegistryRecordRepository } from '../../domain/repositories/registry-record.repository'
import type { RegistryRecordResponseDto } from '../dto'
import { toRegistryRecordResponseDto } from '../mappers/registry-record-response.mapper'

type GetRegistryRecordUseCaseInput = {
    type: RegistryRecordType
    id: string
    organizationId: string | null
}

export class GetRegistryRecordUseCase {
    constructor(
        private readonly registryRecordRepository: RegistryRecordRepository,
    ) {}

    async execute(
        input: GetRegistryRecordUseCaseInput,
    ): Promise<RegistryRecordResponseDto> {
        if (!input.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const record = await this.registryRecordRepository.findById({
            type: input.type,
            id: input.id,
            organizationId: input.organizationId,
        })

        if (!record) {
            throw new NotFoundError('Cadastro nao encontrado')
        }

        return toRegistryRecordResponseDto(record)
    }
}
