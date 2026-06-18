export type RegistryRecordType = 'customer' | 'supplier'
export type RegistryDocumentType = 'CPF' | 'CNPJ' | 'OTHER'
export type RegistryRecordStatus = 'ACTIVE' | 'INACTIVE'

export type RegistryRecordEntity = {
    id: string
    organizationId: string
    name: string
    document: string | null
    documentType: RegistryDocumentType | null
    email: string | null
    phone: string | null
    notes: string | null
    status: RegistryRecordStatus
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}
