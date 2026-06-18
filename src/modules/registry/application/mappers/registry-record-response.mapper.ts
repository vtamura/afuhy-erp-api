import type { RegistryRecordEntity } from '../../domain/entities/registry-record.entity'
import type { RegistryRecordResponseDto } from '../dto'

export function toRegistryRecordResponseDto(
    record: RegistryRecordEntity,
): RegistryRecordResponseDto {
    return {
        id: record.id,
        organizationId: record.organizationId,
        name: record.name,
        document: record.document,
        documentType: record.documentType,
        email: record.email,
        phone: record.phone,
        notes: record.notes,
        status: record.status,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        deletedAt: record.deletedAt?.toISOString() ?? null,
    }
}
