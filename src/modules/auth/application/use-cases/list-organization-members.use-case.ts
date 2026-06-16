import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { OrganizationMemberResponseDto } from '../dto'
import { toOrganizationMemberResponseDto } from '../mappers/organization-response.mapper'

type ListOrganizationMembersUseCaseInput = {
    organizationId: string
    userId: string
}

export class ListOrganizationMembersUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationUserRepository: OrganizationUserRepository,
    ) {}

    async execute(
        input: ListOrganizationMembersUseCaseInput,
    ): Promise<OrganizationMemberResponseDto[]> {
        const organization = await this.organizationRepository.findById(
            input.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const organizationUser =
            await this.organizationUserRepository.findActiveByOrganizationAndUser(
                {
                    organizationId: input.organizationId,
                    userId: input.userId,
                },
            )

        if (!organizationUser) {
            throw new ForbiddenError(
                'Usuario sem vinculo ativo com a organizacao',
            )
        }

        const members = await this.organizationUserRepository.listActiveMembers(
            input.organizationId,
        )

        return members.map(toOrganizationMemberResponseDto)
    }
}
