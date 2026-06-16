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

export interface UserRepository {
    create(input: CreateUserInput): Promise<UserEntity>
    findByEmail(email: string): Promise<UserEntity | null>
    findById(id: string): Promise<UserEntity | null>
    list(): Promise<UserEntity[]>
    update(input: UpdateUserInput): Promise<UserEntity | null>
    softDelete(id: string): Promise<boolean>
}
