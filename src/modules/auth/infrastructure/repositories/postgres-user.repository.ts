import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { UserEntity, type UserStatus } from '../../domain/entities/user.entity'
import type {
    CreateUserInput,
    UpdateUserInput,
    UserRepository,
} from '../../domain/repositories/user.repository'

type UserRow = {
    id: string
    name: string
    email: string
    password_hash: string
    status: UserStatus
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

export class PostgresUserRepository implements UserRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(input: CreateUserInput): Promise<UserEntity> {
        const [row] = await this.databaseClient.query<UserRow>(
            `
                INSERT INTO users (name, email, password_hash)
                VALUES (:name, :email, :passwordHash)
                RETURNING id, name, email, password_hash, status, created_at, updated_at, deleted_at
            `,
            input,
        )

        return this.toEntity(row)
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const [row] = await this.databaseClient.select<UserRow>(
            `
                SELECT id, name, email, password_hash, status, created_at, updated_at, deleted_at
                FROM users
                WHERE email = :email
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            { email },
        )

        return row ? this.toEntity(row) : null
    }

    async findById(id: string): Promise<UserEntity | null> {
        const [row] = await this.databaseClient.select<UserRow>(
            `
                SELECT id, name, email, password_hash, status, created_at, updated_at, deleted_at
                FROM users
                WHERE id = :id
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            { id },
        )

        return row ? this.toEntity(row) : null
    }

    async findByIdInOrganization(input: {
        id: string
        organizationId: string
    }): Promise<UserEntity | null> {
        const [row] = await this.databaseClient.select<UserRow>(
            `
                SELECT u.id, u.name, u.email, u.password_hash, u.status, u.created_at, u.updated_at, u.deleted_at
                FROM users u
                INNER JOIN organization_users ou
                    ON ou.user_id = u.id
                    AND ou.organization_id = :organizationId
                    AND ou.status = 'ACTIVE'
                WHERE u.id = :id
                    AND u.deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async list(): Promise<UserEntity[]> {
        const rows = await this.databaseClient.select<UserRow>(`
            SELECT id, name, email, password_hash, status, created_at, updated_at, deleted_at
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
        `)

        return rows.map((row) => this.toEntity(row))
    }

    async listByOrganization(organizationId: string): Promise<UserEntity[]> {
        const rows = await this.databaseClient.select<UserRow>(
            `
                SELECT u.id, u.name, u.email, u.password_hash, u.status, u.created_at, u.updated_at, u.deleted_at
                FROM organization_users ou
                INNER JOIN users u
                    ON u.id = ou.user_id
                    AND u.deleted_at IS NULL
                WHERE ou.organization_id = :organizationId
                    AND ou.status = 'ACTIVE'
                ORDER BY u.name ASC
            `,
            { organizationId },
        )

        return rows.map((row) => this.toEntity(row))
    }

    async update(input: UpdateUserInput): Promise<UserEntity | null> {
        const [row] = await this.databaseClient.query<UserRow>(
            `
                UPDATE users
                SET name = :name,
                    email = :email,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
                    AND deleted_at IS NULL
                RETURNING id, name, email, password_hash, status, created_at, updated_at, deleted_at
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async updatePasswordHash(input: {
        userId: string
        passwordHash: string
    }): Promise<void> {
        await this.databaseClient.query(
            `
                UPDATE users
                SET password_hash = :passwordHash,
                    updated_at = NOW()
                WHERE id = :userId
                    AND deleted_at IS NULL
            `,
            input,
        )
    }

    async updateInOrganization(
        input: UpdateUserInput & { organizationId: string },
    ): Promise<UserEntity | null> {
        const [row] = await this.databaseClient.query<UserRow>(
            `
                UPDATE users
                SET name = :name,
                    email = :email,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
                    AND deleted_at IS NULL
                    AND EXISTS (
                        SELECT 1
                        FROM organization_users ou
                        WHERE ou.user_id = users.id
                            AND ou.organization_id = :organizationId
                            AND ou.status = 'ACTIVE'
                    )
                RETURNING id, name, email, password_hash, status, created_at, updated_at, deleted_at
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async softDelete(id: string): Promise<boolean> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const deletedRows = await databaseClient.query<{ id: string }>(
                `
                    UPDATE users
                    SET deleted_at = NOW(),
                        updated_at = NOW()
                    WHERE id = :id
                        AND deleted_at IS NULL
                    RETURNING id
                `,
                { id },
            )

            if (!deletedRows.length) {
                return false
            }

            await databaseClient.query(
                `
                    UPDATE sessions
                    SET status = 'REVOKED'
                    WHERE user_id = :id
                        AND status = 'ACTIVE'
                `,
                { id },
            )

            return true
        })
    }

    async softDeleteInOrganization(input: {
        id: string
        organizationId: string
    }): Promise<boolean> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const deletedRows = await databaseClient.query<{ id: string }>(
                `
                    UPDATE users
                    SET deleted_at = NOW(),
                        updated_at = NOW()
                    WHERE id = :id
                        AND deleted_at IS NULL
                        AND EXISTS (
                            SELECT 1
                            FROM organization_users ou
                            WHERE ou.user_id = users.id
                                AND ou.organization_id = :organizationId
                                AND ou.status = 'ACTIVE'
                        )
                    RETURNING id
                `,
                input,
            )

            if (!deletedRows.length) {
                return false
            }

            await databaseClient.query(
                `
                    UPDATE sessions
                    SET status = 'REVOKED'
                    WHERE user_id = :id
                        AND status = 'ACTIVE'
                `,
                { id: input.id },
            )

            return true
        })
    }

    private toEntity(row: UserRow): UserEntity {
        return UserEntity.create({
            id: row.id,
            name: row.name,
            email: row.email,
            passwordHash: row.password_hash,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        })
    }
}
