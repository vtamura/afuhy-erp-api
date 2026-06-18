import type {
    RegistryDocumentType,
    RegistryRecordEntity,
    RegistryRecordStatus,
    RegistryRecordType,
} from '../entities/registry-record.entity'

export type RegistryRecordData = {
    organizationId: string
    name: string
    document: string | null
    documentType: RegistryDocumentType | null
    email: string | null
    phone: string | null
    notes: string | null
    status: RegistryRecordStatus
}

export type RegistryRecordUpdateData = Omit<
    RegistryRecordData,
    'organizationId'
>

export interface RegistryRecordRepository {
    create(
        type: RegistryRecordType,
        data: RegistryRecordData,
    ): Promise<RegistryRecordEntity>
    listByOrganization(
        type: RegistryRecordType,
        organizationId: string,
    ): Promise<RegistryRecordEntity[]>
    findById(input: {
        type: RegistryRecordType
        id: string
        organizationId: string
    }): Promise<RegistryRecordEntity | null>
    findByDocument(input: {
        type: RegistryRecordType
        organizationId: string
        document: string
    }): Promise<RegistryRecordEntity | null>
    update(input: {
        type: RegistryRecordType
        id: string
        organizationId: string
        data: RegistryRecordUpdateData
    }): Promise<RegistryRecordEntity | null>
    softDelete(input: {
        type: RegistryRecordType
        id: string
        organizationId: string
    }): Promise<boolean>
}
