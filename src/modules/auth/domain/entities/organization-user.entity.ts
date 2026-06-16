export type OrganizationUserStatus = 'ACTIVE' | 'INACTIVE'

export type OrganizationUserEntityProps = {
    id: string
    organizationId: string
    userId: string
    status: OrganizationUserStatus
    createdAt: Date
}

export class OrganizationUserEntity {
    private constructor(private readonly props: OrganizationUserEntityProps) {}

    static create(props: OrganizationUserEntityProps): OrganizationUserEntity {
        return new OrganizationUserEntity(props)
    }

    get id(): string {
        return this.props.id
    }

    get organizationId(): string {
        return this.props.organizationId
    }

    get userId(): string {
        return this.props.userId
    }

    get status(): OrganizationUserStatus {
        return this.props.status
    }

    get createdAt(): Date {
        return this.props.createdAt
    }

    get isActive(): boolean {
        return this.props.status === 'ACTIVE'
    }
}
