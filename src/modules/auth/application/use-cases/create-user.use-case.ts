import { ConflictError } from '../../../../shared/domain/errors'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { UserResponseDto } from '../dto'
import { toUserResponseDto } from '../mappers/user-response.mapper'
import type { AuthEmailNotifierPort } from '../ports/auth-email-notifier.port'
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
        private readonly emailNotifier?: AuthEmailNotifierPort,
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

        await this.enqueueUserCreatedEmail({
            name: user.name,
            email: user.email,
        })

        return toUserResponseDto(user)
    }

    private async enqueueUserCreatedEmail(input: {
        name: string
        email: string
    }): Promise<void> {
        try {
            await this.emailNotifier?.notifyUserCreated(input)
        } catch {
            // Email is a non-blocking side effect for user creation.
        }
    }
}
