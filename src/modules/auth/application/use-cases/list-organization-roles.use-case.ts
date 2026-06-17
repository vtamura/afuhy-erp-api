import { NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { OrganizationRoleResponseDto } from '../dto'
import { toOrganizationRoleResponseDto } from '../mappers/organization-response.mapper'

type ListOrganizationRolesUseCaseInput = {
    organizationId: string
}

export class ListOrganizationRolesUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly roleRepository: RoleRepository,
    ) {}

    async execute(
        input: ListOrganizationRolesUseCaseInput,
    ): Promise<OrganizationRoleResponseDto[]> {
        const organization = await this.organizationRepository.findById(
            input.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const roles = await this.roleRepository.listByOrganization(
            input.organizationId,
        )

        return roles.map(toOrganizationRoleResponseDto)
    }
}
