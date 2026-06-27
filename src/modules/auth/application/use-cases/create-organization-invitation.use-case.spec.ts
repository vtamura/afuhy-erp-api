import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import { OrganizationInvitationEntity } from '../../domain/entities/organization-invitation.entity'
import { OrganizationUserEntity } from '../../domain/entities/organization-user.entity'
import { UserEntity } from '../../domain/entities/user.entity'
import type { OrganizationInvitationRepository } from '../../domain/repositories/organization-invitation.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type {
    RoleEntity,
    RoleRepository,
} from '../../domain/repositories/role.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'
import { CreateOrganizationInvitationUseCase } from './create-organization-invitation.use-case'

describe('CreateOrganizationInvitationUseCase', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
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

    function makeUser() {
        return UserEntity.create({
            id: '36ca63af-4e36-4b04-8450-f1cbfb076311',
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            passwordHash: 'hash',
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        })
    }

    function makeRole(input: Partial<RoleEntity> = {}): RoleEntity {
        return {
            id: 'd6518c7f-1637-4fe1-8bd3-29bda239a86d',
            organizationId,
            name: 'Visualizador',
            code: 'VIEWER',
            isSystem: false,
            createdAt: now,
            ...input,
        }
    }

    function makeInvitation(
        input: Partial<
            Parameters<typeof OrganizationInvitationEntity.create>[0]
        > = {},
    ) {
        return OrganizationInvitationEntity.create({
            id: 'edc4c15d-6120-4c6d-949d-df76e7cb28cf',
            organizationId,
            email: 'maria@afuhy.local',
            invitedByUserId: '7fe6d055-9ee0-4cc3-9ef9-7256994315d7',
            tokenHash: 'hashed-token',
            status: 'PENDING',
            expiresAt: new Date('2026-01-08T00:00:00.000Z'),
            acceptedAt: null,
            cancelledAt: null,
            createdAt: now,
            updatedAt: now,
            roles: [makeRole()],
            ...input,
        })
    }

    function makeSut(
        input: {
            user?: UserEntity | null
            activeMember?: OrganizationUserEntity | null
            pendingInvitation?: OrganizationInvitationEntity | null
        } = {},
    ) {
        const createdInvitation = makeInvitation()
        const organizationRepository: OrganizationRepository = {
            create: jest.fn(),
            findByDocument: jest.fn(),
            findById: jest.fn().mockResolvedValue(makeOrganization()),
            listByUserId: jest.fn(),
        }
        const organizationInvitationRepository: OrganizationInvitationRepository =
            {
                create: jest.fn().mockResolvedValue(createdInvitation),
                rotatePending: jest.fn().mockResolvedValue(createdInvitation),
                findPendingByOrganizationAndEmail: jest
                    .fn()
                    .mockResolvedValue(input.pendingInvitation ?? null),
                findByTokenHash: jest.fn(),
                listPendingByOrganization: jest.fn(),
                cancelPending: jest.fn(),
                markAsAccepted: jest.fn(),
            }
        const organizationUserRepository: OrganizationUserRepository = {
            create: jest.fn(),
            createOrReactivate: jest.fn(),
            findByIdInOrganization: jest.fn(),
            findByOrganizationAndUser: jest.fn(),
            findActiveByOrganizationAndUser: jest
                .fn()
                .mockResolvedValue(input.activeMember ?? null),
            findActiveMemberByOrganizationAndUser: jest.fn(),
            deactivate: jest.fn(),
            listActiveMembers: jest.fn(),
        }
        const roleRepository: RoleRepository = {
            findByOrganizationAndCode: jest.fn(),
            findByOrganizationAndCodes: jest
                .fn()
                .mockResolvedValue([makeRole()]),
            listByOrganization: jest.fn(),
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
        const userRepository: UserRepository = {
            create: jest.fn(),
            findByEmail: jest.fn().mockResolvedValue(input.user ?? null),
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
        const tokenHasher: RefreshTokenHasherPort = {
            hash: jest.fn().mockReturnValue('hashed-token'),
        }
        const tokenGenerator = {
            generate: jest.fn().mockReturnValue('raw-token'),
        }
        const useCase = new CreateOrganizationInvitationUseCase(
            organizationRepository,
            organizationInvitationRepository,
            organizationUserRepository,
            roleRepository,
            userRepository,
            tokenHasher,
            tokenGenerator,
        )

        return {
            organizationInvitationRepository,
            organizationUserRepository,
            roleRepository,
            tokenHasher,
            tokenGenerator,
            useCase,
            userRepository,
        }
    }

    it('creates an invitation when user is not an active member', async () => {
        const { organizationInvitationRepository, tokenHasher, useCase } =
            makeSut()

        const result = await useCase.execute({
            organizationId,
            invitedByUserId: '7fe6d055-9ee0-4cc3-9ef9-7256994315d7',
            email: 'maria@afuhy.local',
            roleCodes: ['VIEWER'],
        })

        expect(tokenHasher.hash).toHaveBeenCalledWith('raw-token')
        expect(organizationInvitationRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId,
                email: 'maria@afuhy.local',
                tokenHash: 'hashed-token',
                roleIds: ['d6518c7f-1637-4fe1-8bd3-29bda239a86d'],
            }),
        )
        expect(result.invitationToken).toBeUndefined()
    })

    it('rotates token and roles when invitation is already pending', async () => {
        const pendingInvitation = makeInvitation({
            id: '430dc0f8-fdec-42d2-93df-c6ba35cd19f0',
        })
        const { organizationInvitationRepository, useCase } = makeSut({
            pendingInvitation,
        })

        await useCase.execute({
            organizationId,
            invitedByUserId: '7fe6d055-9ee0-4cc3-9ef9-7256994315d7',
            email: 'maria@afuhy.local',
            roleCodes: ['VIEWER'],
        })

        expect(organizationInvitationRepository.create).not.toHaveBeenCalled()
        expect(
            organizationInvitationRepository.rotatePending,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                invitationId: '430dc0f8-fdec-42d2-93df-c6ba35cd19f0',
                tokenHash: 'hashed-token',
                roleIds: ['d6518c7f-1637-4fe1-8bd3-29bda239a86d'],
            }),
        )
    })

    it('throws when the email already belongs to an active member', async () => {
        const user = makeUser()
        const activeMember = OrganizationUserEntity.create({
            id: '37002c54-b9ef-4253-926a-fc7c35462a30',
            organizationId,
            userId: user.id,
            status: 'ACTIVE',
            createdAt: now,
        })
        const { organizationInvitationRepository, useCase } = makeSut({
            user,
            activeMember,
        })

        await expect(
            useCase.execute({
                organizationId,
                invitedByUserId: '7fe6d055-9ee0-4cc3-9ef9-7256994315d7',
                email: 'maria@afuhy.local',
                roleCodes: ['VIEWER'],
            }),
        ).rejects.toBeInstanceOf(ConflictError)
        expect(organizationInvitationRepository.create).not.toHaveBeenCalled()
    })

    it('throws when a role does not belong to the organization', async () => {
        const { roleRepository, useCase } = makeSut()
        jest.spyOn(
            roleRepository,
            'findByOrganizationAndCodes',
        ).mockResolvedValue([])

        await expect(
            useCase.execute({
                organizationId,
                invitedByUserId: '7fe6d055-9ee0-4cc3-9ef9-7256994315d7',
                email: 'maria@afuhy.local',
                roleCodes: ['UNKNOWN'],
            }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })
})
