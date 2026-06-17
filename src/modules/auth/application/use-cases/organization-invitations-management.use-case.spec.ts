import { NotFoundError } from '../../../../shared/domain/errors'
import { OrganizationEntity } from '../../domain/entities/organization.entity'
import { OrganizationInvitationEntity } from '../../domain/entities/organization-invitation.entity'
import type { OrganizationInvitationRepository } from '../../domain/repositories/organization-invitation.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import { CancelOrganizationInvitationUseCase } from './cancel-organization-invitation.use-case'
import { ListOrganizationInvitationsUseCase } from './list-organization-invitations.use-case'

describe('Organization invitations management use cases', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'
    const invitationId = 'edc4c15d-6120-4c6d-949d-df76e7cb28cf'

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

    function makeInvitation() {
        return OrganizationInvitationEntity.create({
            id: invitationId,
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
            roles: [
                {
                    id: 'd6518c7f-1637-4fe1-8bd3-29bda239a86d',
                    code: 'VIEWER',
                    name: 'Visualizador',
                    isSystem: false,
                },
            ],
        })
    }

    function makeRepositories() {
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
                findByTokenHash: jest.fn(),
                listPendingByOrganization: jest
                    .fn()
                    .mockResolvedValue([makeInvitation()]),
                cancelPending: jest.fn().mockResolvedValue(true),
                markAsAccepted: jest.fn(),
            }

        return { organizationInvitationRepository, organizationRepository }
    }

    it('lists pending organization invitations', async () => {
        const { organizationInvitationRepository, organizationRepository } =
            makeRepositories()
        const useCase = new ListOrganizationInvitationsUseCase(
            organizationRepository,
            organizationInvitationRepository,
        )

        const result = await useCase.execute({ organizationId })

        expect(
            organizationInvitationRepository.listPendingByOrganization,
        ).toHaveBeenCalledWith(organizationId)
        expect(result).toEqual([
            expect.objectContaining({
                id: invitationId,
                email: 'maria@afuhy.local',
                status: 'PENDING',
                invitationToken: undefined,
            }),
        ])
    })

    it('cancels a pending invitation', async () => {
        const { organizationInvitationRepository, organizationRepository } =
            makeRepositories()
        const useCase = new CancelOrganizationInvitationUseCase(
            organizationRepository,
            organizationInvitationRepository,
        )

        await useCase.execute({ organizationId, invitationId })

        expect(
            organizationInvitationRepository.cancelPending,
        ).toHaveBeenCalledWith({
            organizationId,
            invitationId,
        })
    })

    it('throws when cancelling an unknown invitation', async () => {
        const { organizationInvitationRepository, organizationRepository } =
            makeRepositories()
        jest.spyOn(
            organizationInvitationRepository,
            'cancelPending',
        ).mockResolvedValue(false)
        const useCase = new CancelOrganizationInvitationUseCase(
            organizationRepository,
            organizationInvitationRepository,
        )

        await expect(
            useCase.execute({ organizationId, invitationId }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })
})
