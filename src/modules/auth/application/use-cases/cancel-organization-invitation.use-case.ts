import { NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationInvitationRepository } from '../../domain/repositories/organization-invitation.repository'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'

type CancelOrganizationInvitationUseCaseInput = {
    organizationId: string
    invitationId: string
}

export class CancelOrganizationInvitationUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationInvitationRepository: OrganizationInvitationRepository,
    ) {}

    async execute(
        input: CancelOrganizationInvitationUseCaseInput,
    ): Promise<void> {
        const organization = await this.organizationRepository.findById(
            input.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const cancelled =
            await this.organizationInvitationRepository.cancelPending(input)

        if (!cancelled) {
            throw new NotFoundError('Convite nao encontrado')
        }
    }
}
