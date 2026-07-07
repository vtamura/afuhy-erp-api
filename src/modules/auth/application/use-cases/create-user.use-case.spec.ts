import { ConflictError } from '../../../../shared/domain/errors'
import { UserEntity } from '../../domain/entities/user.entity'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { AuthEmailNotifierPort } from '../ports/auth-email-notifier.port'
import type { PasswordHasherPort } from '../ports/password-hasher.port'
import { CreateUserUseCase } from './create-user.use-case'

describe('CreateUserUseCase', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')

    function makeUser() {
        return UserEntity.create({
            id: 'a044f2e8-43f3-4e6f-8d94-e0d6d5ec9819',
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            passwordHash: 'hashed-password',
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        })
    }

    function makeSut(existingUser: UserEntity | null = null) {
        const createdUser = makeUser()
        const userRepository: UserRepository = {
            create: jest.fn().mockResolvedValue(createdUser),
            findByEmail: jest.fn().mockResolvedValue(existingUser),
            findById: jest.fn(),
            findByIdInOrganization: jest.fn(),
            list: jest.fn(),
            listByOrganization: jest.fn(),
            update: jest.fn(),
            updatePasswordHash: jest.fn(),
            updateInOrganization: jest.fn(),
            softDelete: jest.fn(),
            softDeleteInOrganization: jest.fn(),
        }
        const passwordHasher: PasswordHasherPort = {
            hash: jest.fn().mockResolvedValue('hashed-password'),
            compare: jest.fn(),
        }
        const emailNotifier: AuthEmailNotifierPort = {
            notifyUserCreated: jest.fn(),
            notifyPasswordReset: jest.fn(),
            notifyOrganizationInvitation: jest.fn(),
        }
        const useCase = new CreateUserUseCase(
            userRepository,
            passwordHasher,
            emailNotifier,
        )

        return {
            createdUser,
            emailNotifier,
            passwordHasher,
            useCase,
            userRepository,
        }
    }

    it('creates a user with a hashed password', async () => {
        const { passwordHasher, useCase, userRepository } = makeSut()

        const result = await useCase.execute({
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            password: 'Password123',
        })

        expect(passwordHasher.hash).toHaveBeenCalledWith('Password123')
        expect(userRepository.create).toHaveBeenCalledWith({
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            passwordHash: 'hashed-password',
        })
        expect(result).toMatchObject({
            id: 'a044f2e8-43f3-4e6f-8d94-e0d6d5ec9819',
            email: 'maria@afuhy.local',
        })
    })

    it('enqueues a user created email after creating the user', async () => {
        const { emailNotifier, useCase } = makeSut()

        await useCase.execute({
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            password: 'Password123',
        })

        expect(emailNotifier.notifyUserCreated).toHaveBeenCalledWith({
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
        })
    })

    it('does not block user creation when email enqueue fails', async () => {
        const { emailNotifier, useCase } = makeSut()
        jest.spyOn(emailNotifier, 'notifyUserCreated').mockRejectedValue(
            new Error('redis unavailable'),
        )

        await expect(
            useCase.execute({
                name: 'Maria Silva',
                email: 'maria@afuhy.local',
                password: 'Password123',
            }),
        ).resolves.toMatchObject({
            email: 'maria@afuhy.local',
        })
    })

    it('throws when email is already registered', async () => {
        const { useCase, userRepository } = makeSut(makeUser())

        await expect(
            useCase.execute({
                name: 'Maria Silva',
                email: 'maria@afuhy.local',
                password: 'Password123',
            }),
        ).rejects.toBeInstanceOf(ConflictError)
        expect(userRepository.create).not.toHaveBeenCalled()
    })
})
