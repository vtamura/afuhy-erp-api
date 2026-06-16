import { UnauthorizedError } from '../../../../shared/domain/errors'
import { UserEntity } from '../../domain/entities/user.entity'
import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { PasswordHasherPort } from '../ports/password-hasher.port'
import { ChangePasswordUseCase } from './change-password.use-case'

describe('ChangePasswordUseCase', () => {
    const userId = '7ac67dc0-62f3-4ebd-8c7e-65bc6ddf5343'
    const sessionId = '0bb335e9-5f61-469d-a30d-311fc42a165f'
    const now = new Date('2026-01-01T00:00:00.000Z')

    function makeUser() {
        return UserEntity.create({
            id: userId,
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            passwordHash: 'old-hash',
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        })
    }

    function makeSut(isCurrentPasswordValid = true) {
        const userRepository: UserRepository = {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn().mockResolvedValue(makeUser()),
            findByIdInOrganization: jest.fn(),
            list: jest.fn(),
            listByOrganization: jest.fn(),
            update: jest.fn(),
            updatePasswordHash: jest.fn().mockResolvedValue(undefined),
            updateInOrganization: jest.fn(),
            softDelete: jest.fn(),
            softDeleteInOrganization: jest.fn(),
        }
        const sessionRepository: SessionRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            listActiveByUserId: jest.fn(),
            rotateRefreshToken: jest.fn(),
            selectOrganization: jest.fn(),
            revoke: jest.fn(),
            revokeByUser: jest.fn(),
            revokeOtherActiveByUser: jest.fn().mockResolvedValue(undefined),
            revokeAllActiveByUser: jest.fn(),
        }
        const passwordHasher: PasswordHasherPort = {
            hash: jest.fn().mockResolvedValue('new-hash'),
            compare: jest.fn().mockResolvedValue(isCurrentPasswordValid),
        }
        const useCase = new ChangePasswordUseCase(
            userRepository,
            sessionRepository,
            passwordHasher,
        )

        return { passwordHasher, sessionRepository, useCase, userRepository }
    }

    it('updates password hash and revokes other sessions', async () => {
        const { passwordHasher, sessionRepository, useCase, userRepository } =
            makeSut()

        await useCase.execute({
            userId,
            currentSessionId: sessionId,
            currentPassword: 'Password123',
            newPassword: 'NewPassword123',
        })

        expect(passwordHasher.compare).toHaveBeenCalledWith(
            'Password123',
            'old-hash',
        )
        expect(userRepository.updatePasswordHash).toHaveBeenCalledWith({
            userId,
            passwordHash: 'new-hash',
        })
        expect(sessionRepository.revokeOtherActiveByUser).toHaveBeenCalledWith({
            userId,
            currentSessionId: sessionId,
        })
    })

    it('throws when current password is invalid', async () => {
        const { sessionRepository, useCase, userRepository } = makeSut(false)

        await expect(
            useCase.execute({
                userId,
                currentSessionId: sessionId,
                currentPassword: 'wrong',
                newPassword: 'NewPassword123',
            }),
        ).rejects.toBeInstanceOf(UnauthorizedError)
        expect(userRepository.updatePasswordHash).not.toHaveBeenCalled()
        expect(sessionRepository.revokeOtherActiveByUser).not.toHaveBeenCalled()
    })
})
