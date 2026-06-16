import type { OrganizationUserEntity } from '../entities/organization-user.entity'

export type CreateOrganizationUserInput = {
    organizationId: string
    userId: string
}

export type OrganizationMember = {
    organizationUserId: string
    userId: string
    name: string
    email: string
    status: string
    roles: Array<{
        id: string
        code: string
        name: string
        isSystem: boolean
    }>
    createdAt: Date
}

export interface OrganizationUserRepository {
    create(input: CreateOrganizationUserInput): Promise<OrganizationUserEntity>
    createOrReactivate(
        input: CreateOrganizationUserInput,
    ): Promise<OrganizationUserEntity>
    findByIdInOrganization(input: {
        organizationId: string
        organizationUserId: string
    }): Promise<OrganizationUserEntity | null>
    findByOrganizationAndUser(input: {
        organizationId: string
        userId: string
    }): Promise<OrganizationUserEntity | null>
    findActiveByOrganizationAndUser(input: {
        organizationId: string
        userId: string
    }): Promise<OrganizationUserEntity | null>
    deactivate(input: {
        organizationId: string
        organizationUserId: string
    }): Promise<boolean>
    listActiveMembers(organizationId: string): Promise<OrganizationMember[]>
}
