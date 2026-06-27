import { NotFoundError } from '../../../../shared/domain/errors'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type {
    RoleEntity,
    RoleRepository,
} from '../../domain/repositories/role.repository'
import { ListOrganizationRolesUseCase } from './list-organization-roles.use-case'

describe('ListOrganizationRolesUseCase', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'

    function makeOrganization(status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE') {
        return OrganizationEntity.create({
            id: organizationId,
            name: 'Afuhy Tecnologia',
            document: '12345678000190',
            documentType: 'CNPJ',
            status,
            createdAt: now,
            updatedAt: now,
        })
    }

    function makeRole(input: Partial<RoleEntity> = {}): RoleEntity {
        return {
            id: 'd6518c7f-1637-4fe1-8bd3-29bda239a86d',
            organizationId,
            name: 'Administrador',
            code: 'ADMIN',
            isSystem: false,
            createdAt: now,
            ...input,
        }
    }

    function makeSut(
        organization: OrganizationEntity | null = makeOrganization(),
        roles: RoleEntity[] = [makeRole()],
    ) {
        const organizationRepository: OrganizationRepository = {
            create: jest.fn(),
            findByDocument: jest.fn(),
            findById: jest.fn().mockResolvedValue(organization),
            listByUserId: jest.fn(),
        }
        const roleRepository: RoleRepository = {
            findByOrganizationAndCode: jest.fn(),
            findByOrganizationAndCodes: jest.fn(),
            listByOrganization: jest.fn().mockResolvedValue(roles),
            createOrganizationRole: jest.fn(),
            assignRoleToOrganizationUser: jest.fn(),
            replaceOrganizationUserRoles: jest.fn(),
            organizationUserHasRole: jest.fn(),
            countActiveOrganizationUsersWithRole: jest.fn(),
            ensureOrganizationRole: jest.fn(),
            ensureDefaultOrganizationRoles: jest.fn(),
            userHasPermission: jest.fn(),
            listPermissionCodesForUser: jest.fn(),
        }
        const useCase = new ListOrganizationRolesUseCase(
            organizationRepository,
            roleRepository,
        )

        return { organizationRepository, roleRepository, useCase }
    }

    it('lists organization roles', async () => {
        const roles = [
            makeRole(),
            makeRole({
                id: 'e103373f-64ec-4121-94c6-9f27fcbe26be',
                name: 'Visualizador',
                code: 'VIEWER',
            }),
        ]
        const { roleRepository, useCase } = makeSut(makeOrganization(), roles)

        const result = await useCase.execute({ organizationId })

        expect(roleRepository.listByOrganization).toHaveBeenCalledWith(
            organizationId,
        )
        expect(result).toEqual([
            {
                id: 'd6518c7f-1637-4fe1-8bd3-29bda239a86d',
                code: 'ADMIN',
                name: 'Administrador',
                isSystem: false,
                createdAt: now.toISOString(),
            },
            {
                id: 'e103373f-64ec-4121-94c6-9f27fcbe26be',
                code: 'VIEWER',
                name: 'Visualizador',
                isSystem: false,
                createdAt: now.toISOString(),
            },
        ])
    })

    it('throws when organization does not exist', async () => {
        const { roleRepository, useCase } = makeSut(null)

        await expect(
            useCase.execute({ organizationId }),
        ).rejects.toBeInstanceOf(NotFoundError)
        expect(roleRepository.listByOrganization).not.toHaveBeenCalled()
    })

    it('throws when organization is not active', async () => {
        const { roleRepository, useCase } = makeSut(
            makeOrganization('INACTIVE'),
        )

        await expect(
            useCase.execute({ organizationId }),
        ).rejects.toBeInstanceOf(NotFoundError)
        expect(roleRepository.listByOrganization).not.toHaveBeenCalled()
    })
})
