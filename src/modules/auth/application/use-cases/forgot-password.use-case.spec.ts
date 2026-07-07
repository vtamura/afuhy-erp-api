import { UserEntity } from '../../domain/entities/user.entity'
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { AuthEmailNotifierPort } from '../ports/auth-email-notifier.port'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'
import { ForgotPasswordUseCase } from './forgot-password.use-case'

describe('ForgotPasswordUseCase', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(now)
    })

    afterEach(() => {
        jest.useRealTimers()
    })

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

    function makeSut(user: UserEntity | null = makeUser()) {
        const userRepository: UserRepository = {
            create: jest.fn(),
            findByEmail: jest.fn().mockResolvedValue(user),
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
        const passwordResetTokenRepository: PasswordResetTokenRepository = {
            create: jest.fn(),
            findByTokenHash: jest.fn(),
            markAsUsed: jest.fn(),
        }
        const tokenHasher: RefreshTokenHasherPort = {
            hash: jest.fn().mockReturnValue('hashed-token'),
        }
        const tokenGenerator = {
            generate: jest.fn().mockReturnValue('raw-token'),
        }
        const emailNotifier: AuthEmailNotifierPort = {
            notifyUserCreated: jest.fn(),
            notifyPasswordReset: jest.fn(),
            notifyOrganizationInvitation: jest.fn(),
        }
        const useCase = new ForgotPasswordUseCase(
            userRepository,
            passwordResetTokenRepository,
            tokenHasher,
            tokenGenerator,
            emailNotifier,
        )

        return {
            emailNotifier,
            passwordResetTokenRepository,
            tokenHasher,
            useCase,
            userRepository,
        }
    }

    it('creates a reset token and enqueues a reset email for an active user', async () => {
        const {
            emailNotifier,
            passwordResetTokenRepository,
            tokenHasher,
            useCase,
        } = makeSut()

        await useCase.execute({ email: 'maria@afuhy.local' })

        expect(tokenHasher.hash).toHaveBeenCalledWith('raw-token')
        expect(passwordResetTokenRepository.create).toHaveBeenCalledWith({
            userId: 'a044f2e8-43f3-4e6f-8d94-e0d6d5ec9819',
            tokenHash: 'hashed-token',
            expiresAt: new Date('2026-01-01T00:30:00.000Z'),
        })
        expect(emailNotifier.notifyPasswordReset).toHaveBeenCalledWith({
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            resetToken: 'raw-token',
            expiresAt: new Date('2026-01-01T00:30:00.000Z'),
        })
    })

    it('does not enqueue email when the user does not exist', async () => {
        const { emailNotifier, passwordResetTokenRepository, useCase } =
            makeSut(null)

        await useCase.execute({ email: 'unknown@afuhy.local' })

        expect(passwordResetTokenRepository.create).not.toHaveBeenCalled()
        expect(emailNotifier.notifyPasswordReset).not.toHaveBeenCalled()
    })

    it('does not block forgot password when email enqueue fails', async () => {
        const { emailNotifier, useCase } = makeSut()
        jest.spyOn(emailNotifier, 'notifyPasswordReset').mockRejectedValue(
            new Error('redis unavailable'),
        )

        await expect(
            useCase.execute({ email: 'maria@afuhy.local' }),
        ).resolves.toEqual({})
    })
})
