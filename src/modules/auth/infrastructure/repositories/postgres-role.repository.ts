import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    EnsureOrganizationRoleInput,
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

    async findByOrganizationAndCodes(input: {
        organizationId: string
        codes: string[]
    }): Promise<RoleEntity[]> {
        if (!input.codes.length) {
            return []
        }

        const rows = await this.databaseClient.select<RoleRow>(
            `
                SELECT id, organization_id, name, code, is_system, created_at
                FROM roles
                WHERE organization_id = :organizationId
                    AND code IN (:codes)
                ORDER BY name ASC
            `,
            input,
        )

        return rows.map((row) => this.toEntity(row))
    }

    async listByOrganization(organizationId: string): Promise<RoleEntity[]> {
        const rows = await this.databaseClient.select<RoleRow>(
            `
                SELECT id, organization_id, name, code, is_system, created_at
                FROM roles
                WHERE organization_id = :organizationId
                ORDER BY name ASC
            `,
            { organizationId },
        )

        return rows.map((row) => this.toEntity(row))
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

    async replaceOrganizationUserRoles(input: {
        organizationUserId: string
        roleIds: string[]
    }): Promise<void> {
        await this.databaseClient.transaction(async (databaseClient) => {
            await databaseClient.query(
                `
                    DELETE FROM user_roles
                    WHERE organization_user_id = :organizationUserId
                `,
                { organizationUserId: input.organizationUserId },
            )

            if (!input.roleIds.length) {
                return
            }

            await databaseClient.query(
                `
                    INSERT INTO user_roles (organization_user_id, role_id)
                    SELECT :organizationUserId, roles.id
                    FROM roles
                    WHERE roles.id IN (:roleIds)
                    ON CONFLICT DO NOTHING
                `,
                input,
            )
        })
    }

    async organizationUserHasRole(input: {
        organizationUserId: string
        roleCode: string
    }): Promise<boolean> {
        const [row] = await this.databaseClient.select<{ id: string }>(
            `
                SELECT roles.id
                FROM user_roles
                INNER JOIN roles
                    ON roles.id = user_roles.role_id
                WHERE user_roles.organization_user_id = :organizationUserId
                    AND roles.code = :roleCode
                LIMIT 1
            `,
            input,
        )

        return Boolean(row)
    }

    async countActiveOrganizationUsersWithRole(input: {
        organizationId: string
        roleCode: string
    }): Promise<number> {
        const [row] = await this.databaseClient.select<{ total: string }>(
            `
                SELECT COUNT(DISTINCT organization_users.id)::text AS total
                FROM organization_users
                INNER JOIN users
                    ON users.id = organization_users.user_id
                    AND users.deleted_at IS NULL
                INNER JOIN user_roles
                    ON user_roles.organization_user_id = organization_users.id
                INNER JOIN roles
                    ON roles.id = user_roles.role_id
                WHERE organization_users.organization_id = :organizationId
                    AND organization_users.status = 'ACTIVE'
                    AND roles.code = :roleCode
            `,
            input,
        )

        return Number(row?.total ?? 0)
    }

    async ensureOrganizationRole(
        input: EnsureOrganizationRoleInput,
    ): Promise<RoleEntity> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const [row] = await databaseClient.query<RoleRow>(
                `
                    INSERT INTO roles (organization_id, name, code, is_system)
                    VALUES (:organizationId, :name, :code, false)
                    ON CONFLICT DO NOTHING
                    RETURNING id, organization_id, name, code, is_system, created_at
                `,
                input,
            )

            const role = row
                ? this.toEntity(row)
                : await this.findByOrganizationAndCode({
                      organizationId: input.organizationId,
                      code: input.code,
                  })

            if (!role) {
                throw new Error('Organization role could not be ensured')
            }

            await databaseClient.query(
                `
                    INSERT INTO role_permissions (role_id, permission_id)
                    SELECT :roleId, permissions.id
                    FROM permissions
                    WHERE permissions.code IN (:permissionCodes)
                    ON CONFLICT DO NOTHING
                `,
                {
                    roleId: role.id,
                    permissionCodes: input.permissionCodes,
                },
            )

            return role
        })
    }

    async ensureDefaultOrganizationRoles(
        input: readonly EnsureOrganizationRoleInput[],
    ): Promise<RoleEntity[]> {
        const roles: RoleEntity[] = []

        for (const roleInput of input) {
            roles.push(await this.ensureOrganizationRole(roleInput))
        }

        return roles
    }

    async userHasPermission(input: {
        userId: string
        organizationId: string
        permissionCode: string
    }): Promise<boolean> {
        const [row] = await this.databaseClient.select<{ id: string }>(
            `
                SELECT permissions.id
                FROM organization_users
                INNER JOIN user_roles
                    ON user_roles.organization_user_id = organization_users.id
                INNER JOIN role_permissions
                    ON role_permissions.role_id = user_roles.role_id
                INNER JOIN permissions
                    ON permissions.id = role_permissions.permission_id
                WHERE organization_users.user_id = :userId
                    AND organization_users.organization_id = :organizationId
                    AND organization_users.status = 'ACTIVE'
                    AND permissions.code = :permissionCode
                LIMIT 1
            `,
            input,
        )

        return Boolean(row)
    }

    async listPermissionCodesForUser(input: {
        userId: string
        organizationId: string
    }): Promise<string[]> {
        const rows = await this.databaseClient.select<{ code: string }>(
            `
                SELECT DISTINCT permissions.code
                FROM organization_users
                INNER JOIN user_roles
                    ON user_roles.organization_user_id = organization_users.id
                INNER JOIN role_permissions
                    ON role_permissions.role_id = user_roles.role_id
                INNER JOIN permissions
                    ON permissions.id = role_permissions.permission_id
                WHERE organization_users.user_id = :userId
                    AND organization_users.organization_id = :organizationId
                    AND organization_users.status = 'ACTIVE'
                ORDER BY permissions.code ASC
            `,
            input,
        )

        return rows.map((row) => row.code)
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
