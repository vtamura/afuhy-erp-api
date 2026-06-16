import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import {
    OrganizationUserEntity,
    type OrganizationUserStatus,
} from '../../domain/entities/organization-user.entity'
import type {
    CreateOrganizationUserInput,
    OrganizationMember,
    OrganizationUserRepository,
} from '../../domain/repositories/organization-user.repository'

type OrganizationUserRow = {
    id: string
    organization_id: string
    user_id: string
    status: OrganizationUserStatus
    created_at: Date
}

type OrganizationMemberRow = {
    organization_user_id: string
    user_id: string
    name: string
    email: string
    status: string
    roles: Array<{
        id: string
        code: string
        name: string
        isSystem: boolean
    }> | null
    created_at: Date
}

export class PostgresOrganizationUserRepository implements OrganizationUserRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(
        input: CreateOrganizationUserInput,
    ): Promise<OrganizationUserEntity> {
        const [row] = await this.databaseClient.query<OrganizationUserRow>(
            `
                INSERT INTO organization_users (organization_id, user_id)
                VALUES (:organizationId, :userId)
                RETURNING id, organization_id, user_id, status, created_at
            `,
            input,
        )

        return this.toEntity(row)
    }

    async createOrReactivate(
        input: CreateOrganizationUserInput,
    ): Promise<OrganizationUserEntity> {
        const [row] = await this.databaseClient.query<OrganizationUserRow>(
            `
                INSERT INTO organization_users (organization_id, user_id, status)
                VALUES (:organizationId, :userId, 'ACTIVE')
                ON CONFLICT (organization_id, user_id)
                DO UPDATE SET status = 'ACTIVE'
                RETURNING id, organization_id, user_id, status, created_at
            `,
            input,
        )

        return this.toEntity(row)
    }

    async findByIdInOrganization(input: {
        organizationId: string
        organizationUserId: string
    }): Promise<OrganizationUserEntity | null> {
        const [row] = await this.databaseClient.select<OrganizationUserRow>(
            `
                SELECT id, organization_id, user_id, status, created_at
                FROM organization_users
                WHERE id = :organizationUserId
                    AND organization_id = :organizationId
                LIMIT 1
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async findByOrganizationAndUser(input: {
        organizationId: string
        userId: string
    }): Promise<OrganizationUserEntity | null> {
        const [row] = await this.databaseClient.select<OrganizationUserRow>(
            `
                SELECT id, organization_id, user_id, status, created_at
                FROM organization_users
                WHERE organization_id = :organizationId
                    AND user_id = :userId
                LIMIT 1
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async findActiveByOrganizationAndUser(input: {
        organizationId: string
        userId: string
    }): Promise<OrganizationUserEntity | null> {
        const [row] = await this.databaseClient.select<OrganizationUserRow>(
            `
                SELECT id, organization_id, user_id, status, created_at
                FROM organization_users
                WHERE organization_id = :organizationId
                    AND user_id = :userId
                    AND status = 'ACTIVE'
                LIMIT 1
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async deactivate(input: {
        organizationId: string
        organizationUserId: string
    }): Promise<boolean> {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE organization_users
                SET status = 'INACTIVE'
                WHERE id = :organizationUserId
                    AND organization_id = :organizationId
                    AND status = 'ACTIVE'
                RETURNING id
            `,
            input,
        )

        return rows.length > 0
    }

    async listActiveMembers(
        organizationId: string,
    ): Promise<OrganizationMember[]> {
        const rows = await this.databaseClient.select<OrganizationMemberRow>(
            `
                SELECT
                    ou.id AS organization_user_id,
                    u.id AS user_id,
                    u.name,
                    u.email,
                    ou.status,
                    COALESCE(
                        JSONB_AGG(
                            JSONB_BUILD_OBJECT(
                                'id', roles.id,
                                'code', roles.code,
                                'name', roles.name,
                                'isSystem', roles.is_system
                            )
                            ORDER BY roles.name
                        ) FILTER (WHERE roles.id IS NOT NULL),
                        '[]'::jsonb
                    ) AS roles,
                    ou.created_at
                FROM organization_users ou
                INNER JOIN users u
                    ON u.id = ou.user_id
                    AND u.deleted_at IS NULL
                LEFT JOIN user_roles
                    ON user_roles.organization_user_id = ou.id
                LEFT JOIN roles
                    ON roles.id = user_roles.role_id
                WHERE ou.organization_id = :organizationId
                    AND ou.status = 'ACTIVE'
                GROUP BY ou.id, u.id, u.name, u.email, ou.status, ou.created_at
                ORDER BY u.name ASC
            `,
            { organizationId },
        )

        return rows.map((row) => ({
            organizationUserId: row.organization_user_id,
            userId: row.user_id,
            name: row.name,
            email: row.email,
            status: row.status,
            roles: row.roles ?? [],
            createdAt: new Date(row.created_at),
        }))
    }

    private toEntity(row: OrganizationUserRow): OrganizationUserEntity {
        return OrganizationUserEntity.create({
            id: row.id,
            organizationId: row.organization_id,
            userId: row.user_id,
            status: row.status,
            createdAt: new Date(row.created_at),
        })
    }
}
