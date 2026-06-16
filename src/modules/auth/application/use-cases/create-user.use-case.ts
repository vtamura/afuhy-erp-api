import { ConflictError } from '../../../../shared/domain/errors'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { UserResponseDto } from '../dto'
import { toUserResponseDto } from '../mappers/user-response.mapper'
import type { PasswordHasherPort } from '../ports/password-hasher.port'

type CreateUserUseCaseInput = {
    name: string
    email: string
    password: string
}

export class CreateUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasherPort,
    ) {}

    async execute(input: CreateUserUseCaseInput): Promise<UserResponseDto> {
        const existingUser = await this.userRepository.findByEmail(input.email)

        if (existingUser) {
            throw new ConflictError('E-mail ja cadastrado')
        }

        const passwordHash = await this.passwordHasher.hash(input.password)
        const user = await this.userRepository.create({
            name: input.name,
            email: input.email,
            passwordHash,
        })

        return toUserResponseDto(user)
    }
}
