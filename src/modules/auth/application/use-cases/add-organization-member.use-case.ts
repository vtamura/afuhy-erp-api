import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { OrganizationMemberResponseDto } from '../dto'
import { toOrganizationMemberResponseDto } from '../mappers/organization-response.mapper'

type AddOrganizationMemberUseCaseInput = {
    organizationId: string
    email: string
    roleCodes: string[]
}

export class AddOrganizationMemberUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationUserRepository: OrganizationUserRepository,
        private readonly roleRepository: RoleRepository,
        private readonly userRepository: UserRepository,
    ) {}

    async execute(
        input: AddOrganizationMemberUseCaseInput,
    ): Promise<OrganizationMemberResponseDto> {
        const organization = await this.organizationRepository.findById(
            input.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const user = await this.userRepository.findByEmail(input.email)

        if (!user) {
            throw new NotFoundError('Usuario nao encontrado')
        }

        const existingMember =
            await this.organizationUserRepository.findByOrganizationAndUser({
                organizationId: input.organizationId,
                userId: user.id,
            })

        if (existingMember?.isActive) {
            throw new ConflictError('Usuario ja e membro da organizacao')
        }

        const roles = await this.getRoles(input.organizationId, input.roleCodes)
        const organizationUser =
            await this.organizationUserRepository.createOrReactivate({
                organizationId: input.organizationId,
                userId: user.id,
            })

        await this.roleRepository.replaceOrganizationUserRoles({
            organizationUserId: organizationUser.id,
            roleIds: roles.map((role) => role.id),
        })

        const [member] = (
            await this.organizationUserRepository.listActiveMembers(
                input.organizationId,
            )
        ).filter(
            (candidate) => candidate.organizationUserId === organizationUser.id,
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
}
