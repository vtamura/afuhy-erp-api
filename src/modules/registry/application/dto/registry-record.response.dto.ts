export type RegistryRecordResponseDto = {
    id: string
    organizationId: string
    name: string
    document: string | null
    documentType: string | null
    email: string | null
    phone: string | null
    notes: string | null
    status: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}
