export type PasswordResetTokenEntityProps = {
    id: string
    userId: string
    tokenHash: string
    expiresAt: Date
    usedAt?: Date | null
    createdAt: Date
}

export class PasswordResetTokenEntity {
    private constructor(
        private readonly props: PasswordResetTokenEntityProps,
    ) {}

    static create(
        props: PasswordResetTokenEntityProps,
    ): PasswordResetTokenEntity {
        return new PasswordResetTokenEntity(props)
    }

    get id(): string {
        return this.props.id
    }

    get userId(): string {
        return this.props.userId
    }

    get tokenHash(): string {
        return this.props.tokenHash
    }

    get expiresAt(): Date {
        return this.props.expiresAt
    }

    get usedAt(): Date | null {
        return this.props.usedAt ?? null
    }

    get createdAt(): Date {
        return this.props.createdAt
    }

    get isUsable(): boolean {
        return !this.usedAt && this.expiresAt > new Date()
    }
}
