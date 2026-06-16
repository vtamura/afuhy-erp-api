import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import {
    SessionEntity,
    type SessionStatus,
} from '../../domain/entities/session.entity'
import type {
    CreateSessionInput,
    RotateRefreshTokenInput,
    SelectOrganizationInput,
    SessionRepository,
} from '../../domain/repositories/session.repository'

type SessionRow = {
    id: string
    user_id: string
    organization_id: string | null
    refresh_token_hash: string
    user_agent: string | null
    ip_address: string | null
    status: SessionStatus
    expires_at: Date
    created_at: Date
}

export class PostgresSessionRepository implements SessionRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(input: CreateSessionInput): Promise<SessionEntity> {
        const [row] = await this.databaseClient.query<SessionRow>(
            `
                INSERT INTO sessions (
                    user_id,
                    organization_id,
                    refresh_token_hash,
                    user_agent,
                    ip_address,
                    expires_at
                )
                VALUES (
                    :userId,
                    :organizationId,
                    :refreshTokenHash,
                    :userAgent,
                    :ipAddress,
                    :expiresAt
                )
                RETURNING id, user_id, organization_id, refresh_token_hash, user_agent, ip_address, status, expires_at, created_at
            `,
            {
                userId: input.userId,
                organizationId: input.organizationId ?? null,
                refreshTokenHash: input.refreshTokenHash,
                userAgent: input.userAgent ?? null,
                ipAddress: input.ipAddress ?? null,
                expiresAt: input.expiresAt,
            },
        )

        return this.toEntity(row)
    }

    async findById(id: string): Promise<SessionEntity | null> {
        const [row] = await this.databaseClient.select<SessionRow>(
            `
                SELECT id, user_id, organization_id, refresh_token_hash, user_agent, ip_address, status, expires_at, created_at
                FROM sessions
                WHERE id = :id
                LIMIT 1
            `,
            { id },
        )

        return row ? this.toEntity(row) : null
    }

    async rotateRefreshToken(input: RotateRefreshTokenInput): Promise<void> {
        await this.databaseClient.query(
            `
                UPDATE sessions
                SET refresh_token_hash = :refreshTokenHash,
                    expires_at = :expiresAt
                WHERE id = :sessionId
            `,
            input,
        )
    }

    async selectOrganization(input: SelectOrganizationInput): Promise<void> {
        await this.databaseClient.query(
            `
                UPDATE sessions
                SET organization_id = :organizationId,
                    refresh_token_hash = :refreshTokenHash,
                    expires_at = :expiresAt
                WHERE id = :sessionId
            `,
            input,
        )
    }

    async revoke(sessionId: string): Promise<void> {
        await this.databaseClient.query(
            `
                UPDATE sessions
                SET status = 'REVOKED'
                WHERE id = :sessionId
            `,
            { sessionId },
        )
    }

    private toEntity(row: SessionRow): SessionEntity {
        return SessionEntity.create({
            id: row.id,
            userId: row.user_id,
            organizationId: row.organization_id,
            refreshTokenHash: row.refresh_token_hash,
            userAgent: row.user_agent,
            ipAddress: row.ip_address,
            status: row.status,
            expiresAt: new Date(row.expires_at),
            createdAt: new Date(row.created_at),
        })
    }
}
