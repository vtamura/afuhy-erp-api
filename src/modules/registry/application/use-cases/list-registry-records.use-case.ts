import { ForbiddenError } from '../../../../shared/domain/errors'
import type { RegistryRecordType } from '../../domain/entities/registry-record.entity'
import type { RegistryRecordRepository } from '../../domain/repositories/registry-record.repository'
import type { RegistryRecordResponseDto } from '../dto'
import { toRegistryRecordResponseDto } from '../mappers/registry-record-response.mapper'

type ListRegistryRecordsUseCaseInput = {
    type: RegistryRecordType
    organizationId: string | null
}

export class ListRegistryRecordsUseCase {
    constructor(
        private readonly registryRecordRepository: RegistryRecordRepository,
    ) {}

    async execute(
        input: ListRegistryRecordsUseCaseInput,
    ): Promise<RegistryRecordResponseDto[]> {
        if (!input.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const records = await this.registryRecordRepository.listByOrganization(
            input.type,
            input.organizationId,
        )

        return records.map(toRegistryRecordResponseDto)
    }
}
