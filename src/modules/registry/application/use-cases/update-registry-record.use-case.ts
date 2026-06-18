import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type {
    RegistryDocumentType,
    RegistryRecordStatus,
    RegistryRecordType,
} from '../../domain/entities/registry-record.entity'
import type { RegistryRecordRepository } from '../../domain/repositories/registry-record.repository'
import type { RegistryRecordResponseDto } from '../dto'
import { toRegistryRecordResponseDto } from '../mappers/registry-record-response.mapper'

type UpdateRegistryRecordUseCaseInput = {
    type: RegistryRecordType
    id: string
    organizationId: string | null
    name: string
    document: string | null
    documentType: RegistryDocumentType | null
    email: string | null
    phone: string | null
    notes: string | null
    status: RegistryRecordStatus
}

export class UpdateRegistryRecordUseCase {
    constructor(
        private readonly registryRecordRepository: RegistryRecordRepository,
    ) {}

    async execute(
        input: UpdateRegistryRecordUseCaseInput,
    ): Promise<RegistryRecordResponseDto> {
        if (!input.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const current = await this.registryRecordRepository.findById({
            type: input.type,
            id: input.id,
            organizationId: input.organizationId,
        })

        if (!current) {
            throw new NotFoundError('Cadastro nao encontrado')
        }

        if (input.document) {
            const existing = await this.registryRecordRepository.findByDocument(
                {
                    type: input.type,
                    organizationId: input.organizationId,
                    document: input.document,
                },
            )

            if (existing && existing.id !== input.id) {
                throw new ConflictError('Documento ja cadastrado')
            }
        }

        const updated = await this.registryRecordRepository.update({
            type: input.type,
            id: input.id,
            organizationId: input.organizationId,
            data: {
                name: input.name,
                document: input.document,
                documentType: input.documentType,
                email: input.email,
                phone: input.phone,
                notes: input.notes,
                status: input.status,
            },
        })

        if (!updated) {
            throw new NotFoundError('Cadastro nao encontrado')
        }

        return toRegistryRecordResponseDto(updated)
    }
}
