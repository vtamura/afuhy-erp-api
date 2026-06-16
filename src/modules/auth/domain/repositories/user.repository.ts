import type { UserEntity } from '../entities/user.entity'

export type CreateUserInput = {
    name: string
    email: string
    passwordHash: string
}

export type UpdateUserInput = {
    id: string
    name: string
    email: string
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
}

export type OrganizationScopedUserInput = {
    id: string
    organizationId: string
}

export interface UserRepository {
    create(input: CreateUserInput): Promise<UserEntity>
    findByEmail(email: string): Promise<UserEntity | null>
    findById(id: string): Promise<UserEntity | null>
    findByIdInOrganization(
        input: OrganizationScopedUserInput,
    ): Promise<UserEntity | null>
    list(): Promise<UserEntity[]>
    listByOrganization(organizationId: string): Promise<UserEntity[]>
    update(input: UpdateUserInput): Promise<UserEntity | null>
    updatePasswordHash(input: {
        userId: string
        passwordHash: string
    }): Promise<void>
    updateInOrganization(
        input: UpdateUserInput & { organizationId: string },
    ): Promise<UserEntity | null>
    softDelete(id: string): Promise<boolean>
    softDeleteInOrganization(
        input: OrganizationScopedUserInput,
    ): Promise<boolean>
}
