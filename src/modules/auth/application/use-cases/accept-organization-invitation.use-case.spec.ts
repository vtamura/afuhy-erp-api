import {
    BadRequestError,
    UnauthorizedError,
} from '../../../../shared/domain/errors'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import { OrganizationInvitationEntity } from '../../domain/entities/organization-invitation.entity'
import { OrganizationUserEntity } from '../../domain/entities/organization-user.entity'
import { UserEntity } from '../../domain/entities/user.entity'
import type { OrganizationInvitationRepository } from '../../domain/repositories/organization-invitation.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { PasswordHasherPort } from '../ports/password-hasher.port'
import type { RefreshTokenHasherPort } from '../ports/refresh-token-hasher.port'
import { AcceptOrganizationInvitationUseCase } from './accept-organization-invitation.use-case'

describe('AcceptOrganizationInvitationUseCase', () => {
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
            expiresAt: new Date(Date.now() + 60_000),
            acceptedAt: null,
            cancelledAt: null,
            createdAt: now,
            updatedAt: now,
            roles: [
                {
                    id: 'd6518c7f-1637-4fe1-8bd3-29bda239a86d',
                    code: 'VIEWER',
                    name: 'Visualizador',
                    isSystem: false,
                },
            ],
            ...input,
        })
    }

    function makeSut(
        input: {
            invitation?: OrganizationInvitationEntity | null
            user?: UserEntity | null
        } = {},
    ) {
        const createdUser = makeUser()
        const existingUser = Object.prototype.hasOwnProperty.call(input, 'user')
            ? input.user
            : createdUser
        const organizationUser = OrganizationUserEntity.create({
            id: '37002c54-b9ef-4253-926a-fc7c35462a30',
            organizationId,
            userId: createdUser.id,
            status: 'ACTIVE',
            createdAt: now,
        })
        const organizationRepository: OrganizationRepository = {
            create: jest.fn(),
            findByDocument: jest.fn(),
            findById: jest.fn().mockResolvedValue(makeOrganization()),
            listByUserId: jest.fn(),
        }
        const organizationInvitationRepository: OrganizationInvitationRepository =
            {
                create: jest.fn(),
                rotatePending: jest.fn(),
                findPendingByOrganizationAndEmail: jest.fn(),
                findByTokenHash: jest
                    .fn()
                    .mockResolvedValue(
                        input.invitation === undefined
                            ? makeInvitation()
                            : input.invitation,
                    ),
                listPendingByOrganization: jest.fn(),
                cancelPending: jest.fn(),
                markAsAccepted: jest.fn(),
            }
        const organizationUserRepository: OrganizationUserRepository = {
            create: jest.fn(),
            createOrReactivate: jest.fn().mockResolvedValue(organizationUser),
            findByIdInOrganization: jest.fn(),
            findByOrganizationAndUser: jest.fn(),
            findActiveByOrganizationAndUser: jest.fn(),
            deactivate: jest.fn(),
            listActiveMembers: jest.fn(),
        }
        const roleRepository: RoleRepository = {
            findByOrganizationAndCode: jest.fn(),
            findByOrganizationAndCodes: jest.fn(),
            listByOrganization: jest.fn(),
            createOrganizationRole: jest.fn(),
            assignRoleToOrganizationUser: jest.fn(),
            replaceOrganizationUserRoles: jest.fn(),
            organizationUserHasRole: jest.fn(),
            countActiveOrganizationUsersWithRole: jest.fn(),
            ensureOrganizationRole: jest.fn(),
            ensureDefaultOrganizationRoles: jest.fn(),
            userHasPermission: jest.fn(),
        }
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
        const tokenHasher: RefreshTokenHasherPort = {
            hash: jest.fn().mockReturnValue('hashed-token'),
        }
        const useCase = new AcceptOrganizationInvitationUseCase(
            organizationRepository,
            organizationInvitationRepository,
            organizationUserRepository,
            roleRepository,
            userRepository,
            passwordHasher,
            tokenHasher,
        )

        return {
            organizationInvitationRepository,
            organizationUserRepository,
            passwordHasher,
            roleRepository,
            useCase,
            userRepository,
        }
    }

    it('accepts an invitation for an existing active user', async () => {
        const {
            organizationInvitationRepository,
            organizationUserRepository,
            roleRepository,
            useCase,
            userRepository,
        } = makeSut({ user: makeUser() })

        await useCase.execute({ token: 'raw-token' })

        expect(userRepository.create).not.toHaveBeenCalled()
        expect(
            organizationUserRepository.createOrReactivate,
        ).toHaveBeenCalledWith({
            organizationId,
            userId: '36ca63af-4e36-4b04-8450-f1cbfb076311',
        })
        expect(
            roleRepository.replaceOrganizationUserRoles,
        ).toHaveBeenCalledWith({
            organizationUserId: '37002c54-b9ef-4253-926a-fc7c35462a30',
            roleIds: ['d6518c7f-1637-4fe1-8bd3-29bda239a86d'],
        })
        expect(
            organizationInvitationRepository.markAsAccepted,
        ).toHaveBeenCalledWith('edc4c15d-6120-4c6d-949d-df76e7cb28cf')
    })

    it('creates a user when accepting an invitation for a new email', async () => {
        const { passwordHasher, useCase, userRepository } = makeSut({
            user: null,
        })

        await useCase.execute({
            token: 'raw-token',
            name: 'Maria Silva',
            password: 'Password123',
        })

        expect(passwordHasher.hash).toHaveBeenCalledWith('Password123')
        expect(userRepository.create).toHaveBeenCalledWith({
            name: 'Maria Silva',
            email: 'maria@afuhy.local',
            passwordHash: 'hashed-password',
        })
    })

    it('rejects a missing or unusable token', async () => {
        const { useCase } = makeSut({ invitation: null })

        await expect(
            useCase.execute({ token: 'raw-token' }),
        ).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it('rejects an expired invitation', async () => {
        const { useCase } = makeSut({
            invitation: makeInvitation({
                expiresAt: new Date(Date.now() - 60_000),
            }),
        })

        await expect(
            useCase.execute({ token: 'raw-token' }),
        ).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it.each(['ACCEPTED', 'CANCELLED'] as const)(
        'rejects a %s invitation',
        async (status) => {
            const { useCase } = makeSut({
                invitation: makeInvitation({ status }),
            })

            await expect(
                useCase.execute({ token: 'raw-token' }),
            ).rejects.toBeInstanceOf(UnauthorizedError)
        },
    )

    it('requires name and password when user does not exist', async () => {
        const { useCase } = makeSut({ user: null })

        await expect(
            useCase.execute({ token: 'raw-token' }),
        ).rejects.toBeInstanceOf(BadRequestError)
    })
})
