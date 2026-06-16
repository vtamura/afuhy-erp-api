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
                    ou.created_at
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

        return rows.map((row) => ({
            organizationUserId: row.organization_user_id,
            userId: row.user_id,
            name: row.name,
            email: row.email,
            status: row.status,
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
