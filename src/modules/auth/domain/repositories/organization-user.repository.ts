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
    createdAt: Date
}

export interface OrganizationUserRepository {
    create(input: CreateOrganizationUserInput): Promise<OrganizationUserEntity>
    findActiveByOrganizationAndUser(input: {
        organizationId: string
        userId: string
    }): Promise<OrganizationUserEntity | null>
    listActiveMembers(organizationId: string): Promise<OrganizationMember[]>
}
