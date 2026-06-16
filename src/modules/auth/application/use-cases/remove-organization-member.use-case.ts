import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'

type RemoveOrganizationMemberUseCaseInput = {
    organizationId: string
    organizationUserId: string
}

const ADMIN_ROLE_CODE = 'ADMIN'

export class RemoveOrganizationMemberUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationUserRepository: OrganizationUserRepository,
        private readonly roleRepository: RoleRepository,
    ) {}

    async execute(input: RemoveOrganizationMemberUseCaseInput): Promise<void> {
        const organization = await this.organizationRepository.findById(
            input.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const organizationUser =
            await this.organizationUserRepository.findByIdInOrganization({
                organizationId: input.organizationId,
                organizationUserId: input.organizationUserId,
            })

        if (!organizationUser?.isActive) {
            throw new NotFoundError('Membro nao encontrado')
        }

        const currentHasAdminRole =
            await this.roleRepository.organizationUserHasRole({
                organizationUserId: input.organizationUserId,
                roleCode: ADMIN_ROLE_CODE,
            })

        if (currentHasAdminRole) {
            await this.ensureAnotherActiveAdmin(input.organizationId)
        }

        const removed = await this.organizationUserRepository.deactivate(input)

        if (!removed) {
            throw new NotFoundError('Membro nao encontrado')
        }
    }

    private async ensureAnotherActiveAdmin(organizationId: string) {
        const activeAdmins =
            await this.roleRepository.countActiveOrganizationUsersWithRole({
                organizationId,
                roleCode: ADMIN_ROLE_CODE,
            })

        if (activeAdmins <= 1) {
            throw new ForbiddenError(
                'A organizacao deve manter ao menos um ADMIN ativo',
            )
        }
    }
}
