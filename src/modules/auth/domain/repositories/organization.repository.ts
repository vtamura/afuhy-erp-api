import type {
    OrganizationDocumentType,
    OrganizationEntity,
} from '../entities/organization.entity'

export type CreateOrganizationInput = {
    name: string
    document: string
    documentType: OrganizationDocumentType
}

export interface OrganizationRepository {
    create(input: CreateOrganizationInput): Promise<OrganizationEntity>
    findByDocument(document: string): Promise<OrganizationEntity | null>
    findById(id: string): Promise<OrganizationEntity | null>
    listByUserId(userId: string): Promise<OrganizationEntity[]>
}
