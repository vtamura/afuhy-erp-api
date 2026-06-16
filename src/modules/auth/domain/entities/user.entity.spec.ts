import { UserEntity } from './user.entity'

describe('UserEntity', () => {
    const baseUser = {
        id: 'f7cd69d7-bbd4-46b3-8eaf-52f69a2bb436',
        name: 'Maria Silva',
        email: 'maria@afuhy.local',
        passwordHash: 'hashed-password',
        status: 'ACTIVE' as const,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        deletedAt: null,
    }

    it('is active when status is ACTIVE and user is not deleted', () => {
        const user = UserEntity.create(baseUser)

        expect(user.isActive).toBe(true)
    })

    it('is inactive when status is not ACTIVE', () => {
        const user = UserEntity.create({
            ...baseUser,
            status: 'BLOCKED',
        })

        expect(user.isActive).toBe(false)
    })

    it('is inactive when deletedAt is set', () => {
        const user = UserEntity.create({
            ...baseUser,
            deletedAt: new Date('2026-01-02T00:00:00.000Z'),
        })

        expect(user.isActive).toBe(false)
    })
})
