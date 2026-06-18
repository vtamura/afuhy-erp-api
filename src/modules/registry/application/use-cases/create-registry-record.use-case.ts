import { ConflictError, ForbiddenError } from '../../../../shared/domain/errors'
import type {
    RegistryDocumentType,
    RegistryRecordStatus,
    RegistryRecordType,
} from '../../domain/entities/registry-record.entity'
import type { RegistryRecordRepository } from '../../domain/repositories/registry-record.repository'
import type { RegistryRecordResponseDto } from '../dto'
import { toRegistryRecordResponseDto } from '../mappers/registry-record-response.mapper'

type CreateRegistryRecordUseCaseInput = {
    type: RegistryRecordType
    organizationId: string | null
    name: string
    document: string | null
    documentType: RegistryDocumentType | null
    email: string | null
    phone: string | null
    notes: string | null
    status: RegistryRecordStatus
}

export class CreateRegistryRecordUseCase {
    constructor(
        private readonly registryRecordRepository: RegistryRecordRepository,
    ) {}

    async execute(
        input: CreateRegistryRecordUseCaseInput,
    ): Promise<RegistryRecordResponseDto> {
        if (!input.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        if (input.document) {
            const existing = await this.registryRecordRepository.findByDocument(
                {
                    type: input.type,
                    organizationId: input.organizationId,
                    document: input.document,
                },
            )

            if (existing) {
                throw new ConflictError('Documento ja cadastrado')
            }
        }

        const record = await this.registryRecordRepository.create(input.type, {
            organizationId: input.organizationId,
            name: input.name,
            document: input.document,
            documentType: input.documentType,
            email: input.email,
            phone: input.phone,
            notes: input.notes,
            status: input.status,
        })

        return toRegistryRecordResponseDto(record)
    }
}
