import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { UserStatus } from '../../domain/entities/user.entity'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { UserResponseDto } from '../dto'
import { toUserResponseDto } from '../mappers/user-response.mapper'

type UpdateUserUseCaseInput = {
    id: string
    name: string
    email: string
    status: UserStatus
    organizationId: string
}

export class UpdateUserUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: UpdateUserUseCaseInput): Promise<UserResponseDto> {
        const user = await this.userRepository.findByIdInOrganization({
            id: input.id,
            organizationId: input.organizationId,
        })

        if (!user) {
            throw new NotFoundError('Usuario nao encontrado')
        }

        const userWithEmail = await this.userRepository.findByEmail(input.email)

        if (userWithEmail && userWithEmail.id !== input.id) {
            throw new ConflictError('E-mail ja cadastrado')
        }

        const updatedUser =
            await this.userRepository.updateInOrganization(input)

        if (!updatedUser) {
            throw new NotFoundError('Usuario nao encontrado')
        }

        return toUserResponseDto(updatedUser)
    }
}
