export type SessionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export type SessionEntityProps = {
    id: string
    userId: string
    organizationId?: string | null
    refreshTokenHash: string
    userAgent?: string | null
    ipAddress?: string | null
    status: SessionStatus
    expiresAt: Date
    createdAt: Date
}

export class SessionEntity {
    private constructor(private readonly props: SessionEntityProps) {}

    static create(props: SessionEntityProps): SessionEntity {
        return new SessionEntity(props)
    }

    get id(): string {
        return this.props.id
    }

    get userId(): string {
        return this.props.userId
    }

    get organizationId(): string | null {
        return this.props.organizationId ?? null
    }

    get refreshTokenHash(): string {
        return this.props.refreshTokenHash
    }

    get status(): SessionStatus {
        return this.props.status
    }

    get expiresAt(): Date {
        return this.props.expiresAt
    }

    get createdAt(): Date {
        return this.props.createdAt
    }

    get isActive(): boolean {
        return (
            this.props.status === 'ACTIVE' && this.props.expiresAt > new Date()
        )
    }
}
