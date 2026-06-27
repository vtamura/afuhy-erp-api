import { ForbiddenError } from '../../../../shared/domain/errors'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import { AuthContextService } from './auth-context.service'

describe('AuthContextService', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const userId = '4cb3057c-4759-4fb6-9fe7-235ec17a418e'
    const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'

    function makeOrganization() {
        return OrganizationEntity.create({
            id: organizationId,
            name: 'Afuhy Tecnologia',
            document: '12345678000190',
            documentType: 'CNPJ',
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
        })
    }

    function makeSut(input: { hasMember?: boolean } = {}) {
        const organizationRepository = {
            findById: jest.fn().mockResolvedValue(makeOrganization()),
        } as unknown as OrganizationRepository
        const organizationUserRepository = {
            findActiveMemberByOrganizationAndUser: jest.fn().mockResolvedValue(
                input.hasMember === false
                    ? null
                    : {
                          organizationUserId:
                              'ee4f5fef-78ab-4738-8fd9-497ad5f46711',
                          userId,
                          name: 'Maria Silva',
                          email: 'maria@afuhy.local',
                          status: 'ACTIVE',
                          roles: [
                              {
                                  id: 'd6518c7f-1637-4fe1-8bd3-29bda239a86d',
                                  code: 'ADMIN',
                                  name: 'Administrador',
                                  isSystem: false,
                              },
                          ],
                          createdAt: now,
                      },
            ),
        } as unknown as OrganizationUserRepository
        const roleRepository = {
            listPermissionCodesForUser: jest
                .fn()
                .mockResolvedValue(['financial.entries.read']),
        } as unknown as RoleRepository

        const service = new AuthContextService(
            organizationRepository,
            organizationUserRepository,
            roleRepository,
        )

        return {
            organizationRepository,
            organizationUserRepository,
            roleRepository,
            service,
        }
    }

    it('returns null context when no organization is selected', async () => {
        const { organizationRepository, service } = makeSut()

        const result = await service.resolve({ userId, organizationId: null })

        expect(result).toEqual({
            currentOrganization: null,
            currentMembership: null,
        })
        expect(organizationRepository.findById).not.toHaveBeenCalled()
    })

    it('returns current organization, roles and permissions', async () => {
        const { roleRepository, service } = makeSut()

        const result = await service.resolve({ userId, organizationId })

        expect(roleRepository.listPermissionCodesForUser).toHaveBeenCalledWith({
            userId,
            organizationId,
        })
        expect(result.currentOrganization?.id).toBe(organizationId)
        expect(result.currentMembership).toEqual({
            organizationUserId: 'ee4f5fef-78ab-4738-8fd9-497ad5f46711',
            userId,
            status: 'ACTIVE',
            roles: [
                {
                    id: 'd6518c7f-1637-4fe1-8bd3-29bda239a86d',
                    code: 'ADMIN',
                    name: 'Administrador',
                    isSystem: false,
                },
            ],
            permissions: ['financial.entries.read'],
            createdAt: now.toISOString(),
        })
    })

    it('throws when the user has no active membership', async () => {
        const { service } = makeSut({ hasMember: false })

        await expect(
            service.resolve({ userId, organizationId }),
        ).rejects.toBeInstanceOf(ForbiddenError)
    })
})
