import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { OrganizationMemberResponseDto } from '../dto'
import { toOrganizationMemberResponseDto } from '../mappers/organization-response.mapper'

type UpdateMemberRolesUseCaseInput = {
    organizationId: string
    organizationUserId: string
    roleCodes: string[]
}

const ADMIN_ROLE_CODE = 'ADMIN'

export class UpdateMemberRolesUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationUserRepository: OrganizationUserRepository,
        private readonly roleRepository: RoleRepository,
    ) {}

    async execute(
        input: UpdateMemberRolesUseCaseInput,
    ): Promise<OrganizationMemberResponseDto> {
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

        const roles = await this.getRoles(input.organizationId, input.roleCodes)
        const nextHasAdminRole = roles.some(
            (role) => role.code === ADMIN_ROLE_CODE,
        )
        const currentHasAdminRole =
            await this.roleRepository.organizationUserHasRole({
                organizationUserId: input.organizationUserId,
                roleCode: ADMIN_ROLE_CODE,
            })

        if (currentHasAdminRole && !nextHasAdminRole) {
            await this.ensureAnotherActiveAdmin(input.organizationId)
        }

        await this.roleRepository.replaceOrganizationUserRoles({
            organizationUserId: input.organizationUserId,
            roleIds: roles.map((role) => role.id),
        })

        const [member] = (
            await this.organizationUserRepository.listActiveMembers(
                input.organizationId,
            )
        ).filter(
            (candidate) =>
                candidate.organizationUserId === input.organizationUserId,
        )

        if (!member) {
            throw new NotFoundError('Membro nao encontrado')
        }

        return toOrganizationMemberResponseDto(member)
    }

    private async getRoles(organizationId: string, roleCodes: string[]) {
        const uniqueRoleCodes = Array.from(new Set(roleCodes))
        const roles = await this.roleRepository.findByOrganizationAndCodes({
            organizationId,
            codes: uniqueRoleCodes,
        })

        if (roles.length !== uniqueRoleCodes.length) {
            throw new NotFoundError('Role nao encontrada')
        }

        return roles
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
