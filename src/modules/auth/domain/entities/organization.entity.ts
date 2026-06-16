export type OrganizationDocumentType = 'CPF' | 'CNPJ'
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type OrganizationEntityProps = {
    id: string
    name: string
    document: string
    documentType: OrganizationDocumentType
    status: OrganizationStatus
    createdAt: Date
    updatedAt: Date
}

export class OrganizationEntity {
    private constructor(private readonly props: OrganizationEntityProps) {}

    static create(props: OrganizationEntityProps): OrganizationEntity {
        return new OrganizationEntity(props)
    }

    get id(): string {
        return this.props.id
    }

    get name(): string {
        return this.props.name
    }

    get document(): string {
        return this.props.document
    }

    get documentType(): OrganizationDocumentType {
        return this.props.documentType
    }

    get status(): OrganizationStatus {
        return this.props.status
    }

    get createdAt(): Date {
        return this.props.createdAt
    }

    get updatedAt(): Date {
        return this.props.updatedAt
    }

    get isActive(): boolean {
        return this.props.status === 'ACTIVE'
    }
}
