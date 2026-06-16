import { SessionEntity } from '../../domain/entities/session.entity'
import type { SessionRepository } from '../../domain/repositories/session.repository'
import { ListSessionsUseCase } from './list-sessions.use-case'

describe('ListSessionsUseCase', () => {
    it('maps active sessions without leaking refresh token hashes', async () => {
        const session = SessionEntity.create({
            id: '618e64e1-bad5-4d74-80a8-d0e366d1deed',
            userId: 'ee301463-7fdb-4441-b13d-b0edee70935a',
            organizationId: null,
            refreshTokenHash: 'secret-refresh-hash',
            userAgent: 'jest',
            ipAddress: '127.0.0.1',
            status: 'ACTIVE',
            expiresAt: new Date('2026-01-02T00:00:00.000Z'),
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
        })
        const sessionRepository: SessionRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            listActiveByUserId: jest.fn().mockResolvedValue([session]),
            rotateRefreshToken: jest.fn(),
            selectOrganization: jest.fn(),
            revoke: jest.fn(),
            revokeByUser: jest.fn(),
            revokeOtherActiveByUser: jest.fn(),
            revokeAllActiveByUser: jest.fn(),
        }
        const useCase = new ListSessionsUseCase(sessionRepository)

        const result = await useCase.execute(
            'ee301463-7fdb-4441-b13d-b0edee70935a',
        )

        expect(result).toEqual([
            {
                id: '618e64e1-bad5-4d74-80a8-d0e366d1deed',
                organizationId: null,
                userAgent: 'jest',
                ipAddress: '127.0.0.1',
                status: 'ACTIVE',
                expiresAt: '2026-01-02T00:00:00.000Z',
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ])
        expect(JSON.stringify(result)).not.toContain('secret-refresh-hash')
    })
})
