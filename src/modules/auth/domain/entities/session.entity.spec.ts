import { SessionEntity } from './session.entity'

describe('SessionEntity', () => {
    const baseSession = {
        id: '77e85851-9241-42b1-a563-64d7ec7e0a38',
        userId: '4bb6cc33-c461-4b45-90f0-2eedb9083ef8',
        organizationId: null,
        refreshTokenHash: 'refresh-token-hash',
        userAgent: 'jest',
        ipAddress: '127.0.0.1',
        status: 'ACTIVE' as const,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }

    it('is active when status is ACTIVE and expiration is in the future', () => {
        const session = SessionEntity.create(baseSession)

        expect(session.isActive).toBe(true)
    })

    it('is inactive when status is not ACTIVE', () => {
        const session = SessionEntity.create({
            ...baseSession,
            status: 'REVOKED',
        })

        expect(session.isActive).toBe(false)
    })

    it('is inactive when expiration is in the past', () => {
        const session = SessionEntity.create({
            ...baseSession,
            expiresAt: new Date(Date.now() - 60_000),
        })

        expect(session.isActive).toBe(false)
    })
})
