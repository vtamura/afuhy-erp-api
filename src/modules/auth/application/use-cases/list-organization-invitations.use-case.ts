import { NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationInvitationRepository } from '../../domain/repositories/organization-invitation.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationInvitationResponseDto } from '../dto'
import { toOrganizationInvitationResponseDto } from '../mappers/organization-response.mapper'

type ListOrganizationInvitationsUseCaseInput = {
    organizationId: string
}

export class ListOrganizationInvitationsUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationInvitationRepository: OrganizationInvitationRepository,
    ) {}

    async execute(
        input: ListOrganizationInvitationsUseCaseInput,
    ): Promise<OrganizationInvitationResponseDto[]> {
        const organization = await this.organizationRepository.findById(
            input.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const invitations =
            await this.organizationInvitationRepository.listPendingByOrganization(
                input.organizationId,
            )

        return invitations.map((invitation) =>
            toOrganizationInvitationResponseDto(invitation),
        )
    }
}
