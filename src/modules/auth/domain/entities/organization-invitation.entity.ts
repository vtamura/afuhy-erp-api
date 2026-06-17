export type OrganizationInvitationStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED'

export type OrganizationInvitationRole = {
    id: string
    code: string
    name: string
    isSystem: boolean
}

export type OrganizationInvitationEntityProps = {
    id: string
    organizationId: string
    email: string
    invitedByUserId: string
    tokenHash: string
    status: OrganizationInvitationStatus
    expiresAt: Date
    acceptedAt: Date | null
    cancelledAt: Date | null
    createdAt: Date
    updatedAt: Date
    roles: OrganizationInvitationRole[]
}

export class OrganizationInvitationEntity {
    private constructor(
        private readonly props: OrganizationInvitationEntityProps,
    ) {}

    static create(
        props: OrganizationInvitationEntityProps,
    ): OrganizationInvitationEntity {
        return new OrganizationInvitationEntity(props)
    }

    get id(): string {
        return this.props.id
    }

    get organizationId(): string {
        return this.props.organizationId
    }

    get email(): string {
        return this.props.email
    }

    get invitedByUserId(): string {
        return this.props.invitedByUserId
    }

    get tokenHash(): string {
        return this.props.tokenHash
    }

    get status(): OrganizationInvitationStatus {
        return this.props.status
    }

    get expiresAt(): Date {
        return this.props.expiresAt
    }

    get acceptedAt(): Date | null {
        return this.props.acceptedAt
    }

    get cancelledAt(): Date | null {
        return this.props.cancelledAt
    }

    get createdAt(): Date {
        return this.props.createdAt
    }

    get updatedAt(): Date {
        return this.props.updatedAt
    }

    get roles(): OrganizationInvitationRole[] {
        return this.props.roles
    }

    get isUsable(): boolean {
        return (
            this.props.status === 'PENDING' && this.props.expiresAt > new Date()
        )
    }
}
