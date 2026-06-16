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

    async list(): Promise<UserEntity[]> {
        const rows = await this.databaseClient.select<UserRow>(`
            SELECT id, name, email, password_hash, status, created_at, updated_at, deleted_at
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
        `)

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
