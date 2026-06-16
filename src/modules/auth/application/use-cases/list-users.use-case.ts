import type { UserRepository } from '../../domain/repositories/user.repository'
import type { UserResponseDto } from '../dto'
import { toUserResponseDto } from '../mappers/user-response.mapper'

export class ListUsersUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(organizationId: string): Promise<UserResponseDto[]> {
        const users =
            await this.userRepository.listByOrganization(organizationId)
        return users.map(toUserResponseDto)
    }
}
