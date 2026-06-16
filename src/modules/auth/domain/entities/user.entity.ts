export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'

export type UserEntityProps = {
    id: string
    name: string
    email: string
    passwordHash: string
    status: UserStatus
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
}

export class UserEntity {
    private constructor(private readonly props: UserEntityProps) {}

    static create(props: UserEntityProps): UserEntity {
        return new UserEntity(props)
    }

    get id(): string {
        return this.props.id
    }

    get name(): string {
        return this.props.name
    }

    get email(): string {
        return this.props.email
    }

    get passwordHash(): string {
        return this.props.passwordHash
    }

    get status(): UserStatus {
        return this.props.status
    }

    get createdAt(): Date {
        return this.props.createdAt
    }

    get updatedAt(): Date {
        return this.props.updatedAt
    }

    get deletedAt(): Date | null {
        return this.props.deletedAt ?? null
    }

    get isActive(): boolean {
        return this.props.status === 'ACTIVE' && !this.props.deletedAt
    }
}
