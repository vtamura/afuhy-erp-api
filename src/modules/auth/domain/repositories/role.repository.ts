export type RoleEntity = {
    id: string
    organizationId: string | null
    name: string
    code: string
    isSystem: boolean
    createdAt: Date
}

export interface RoleRepository {
    findByOrganizationAndCode(input: {
        organizationId: string
        code: string
    }): Promise<RoleEntity | null>
    createOrganizationRole(input: {
        organizationId: string
        name: string
        code: string
    }): Promise<RoleEntity>
    assignRoleToOrganizationUser(input: {
        organizationUserId: string
        roleId: string
    }): Promise<void>
}
