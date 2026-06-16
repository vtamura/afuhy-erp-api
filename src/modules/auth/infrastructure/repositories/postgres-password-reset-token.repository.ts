import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { PasswordResetTokenEntity } from '../../domain/entities/password-reset-token.entity'
import type {
    CreatePasswordResetTokenInput,
    PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository'

type PasswordResetTokenRow = {
    id: string
    user_id: string
    token_hash: string
    expires_at: Date
    used_at: Date | null
    created_at: Date
}

export class PostgresPasswordResetTokenRepository implements PasswordResetTokenRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(
        input: CreatePasswordResetTokenInput,
    ): Promise<PasswordResetTokenEntity> {
        const [row] = await this.databaseClient.query<PasswordResetTokenRow>(
            `
                INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
                VALUES (:userId, :tokenHash, :expiresAt)
                RETURNING id, user_id, token_hash, expires_at, used_at, created_at
            `,
            input,
        )

        return this.toEntity(row)
    }

    async findByTokenHash(
        tokenHash: string,
    ): Promise<PasswordResetTokenEntity | null> {
        const [row] = await this.databaseClient.select<PasswordResetTokenRow>(
            `
                SELECT id, user_id, token_hash, expires_at, used_at, created_at
                FROM password_reset_tokens
                WHERE token_hash = :tokenHash
                LIMIT 1
            `,
            { tokenHash },
        )

        return row ? this.toEntity(row) : null
    }

    async markAsUsed(tokenId: string): Promise<void> {
        await this.databaseClient.query(
            `
                UPDATE password_reset_tokens
                SET used_at = NOW()
                WHERE id = :tokenId
                    AND used_at IS NULL
            `,
            { tokenId },
        )
    }

    private toEntity(row: PasswordResetTokenRow): PasswordResetTokenEntity {
        return PasswordResetTokenEntity.create({
            id: row.id,
            userId: row.user_id,
            tokenHash: row.token_hash,
            expiresAt: new Date(row.expires_at),
            usedAt: row.used_at ? new Date(row.used_at) : null,
            createdAt: new Date(row.created_at),
        })
    }
}
