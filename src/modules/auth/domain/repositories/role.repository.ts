export type RoleEntity = {
    id: string
    organizationId: string | null
    name: string
    code: string
    isSystem: boolean
    createdAt: Date
}

export type EnsureOrganizationRoleInput = {
    organizationId: string
    name: string
    code: string
    permissionCodes: readonly string[]
}

export interface RoleRepository {
    findByOrganizationAndCode(input: {
        organizationId: string
        code: string
    }): Promise<RoleEntity | null>
    findByOrganizationAndCodes(input: {
        organizationId: string
        codes: string[]
    }): Promise<RoleEntity[]>
    listByOrganization(organizationId: string): Promise<RoleEntity[]>
    createOrganizationRole(input: {
        organizationId: string
        name: string
        code: string
    }): Promise<RoleEntity>
    assignRoleToOrganizationUser(input: {
        organizationUserId: string
        roleId: string
    }): Promise<void>
    replaceOrganizationUserRoles(input: {
        organizationUserId: string
        roleIds: string[]
    }): Promise<void>
    organizationUserHasRole(input: {
        organizationUserId: string
        roleCode: string
    }): Promise<boolean>
    countActiveOrganizationUsersWithRole(input: {
        organizationId: string
        roleCode: string
    }): Promise<number>
    ensureOrganizationRole(
        input: EnsureOrganizationRoleInput,
    ): Promise<RoleEntity>
    ensureDefaultOrganizationRoles(
        input: readonly EnsureOrganizationRoleInput[],
    ): Promise<RoleEntity[]>
    userHasPermission(input: {
        userId: string
        organizationId: string
        permissionCode: string
    }): Promise<boolean>
}
