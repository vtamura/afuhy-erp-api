import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    RoleEntity,
    RoleRepository,
} from '../../domain/repositories/role.repository'

type RoleRow = {
    id: string
    organization_id: string | null
    name: string
    code: string
    is_system: boolean
    created_at: Date
}

export class PostgresRoleRepository implements RoleRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async findByOrganizationAndCode(input: {
        organizationId: string
        code: string
    }): Promise<RoleEntity | null> {
        const [row] = await this.databaseClient.select<RoleRow>(
            `
                SELECT id, organization_id, name, code, is_system, created_at
                FROM roles
                WHERE organization_id = :organizationId
                    AND code = :code
                LIMIT 1
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async createOrganizationRole(input: {
        organizationId: string
        name: string
        code: string
    }): Promise<RoleEntity> {
        const [row] = await this.databaseClient.query<RoleRow>(
            `
                INSERT INTO roles (organization_id, name, code, is_system)
                VALUES (:organizationId, :name, :code, false)
                RETURNING id, organization_id, name, code, is_system, created_at
            `,
            input,
        )

        return this.toEntity(row)
    }

    async assignRoleToOrganizationUser(input: {
        organizationUserId: string
        roleId: string
    }): Promise<void> {
        await this.databaseClient.query(
            `
                INSERT INTO user_roles (organization_user_id, role_id)
                VALUES (:organizationUserId, :roleId)
                ON CONFLICT DO NOTHING
            `,
            input,
        )
    }

    private toEntity(row: RoleRow): RoleEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            code: row.code,
            isSystem: row.is_system,
            createdAt: new Date(row.created_at),
        }
    }
}
