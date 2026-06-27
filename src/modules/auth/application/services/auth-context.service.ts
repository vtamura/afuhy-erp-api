import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type {
    CurrentMembershipResponseDto,
    OrganizationResponseDto,
} from '../dto'
import { toOrganizationResponseDto } from '../mappers/organization-response.mapper'

export type CurrentAuthContext = {
    currentOrganization: OrganizationResponseDto | null
    currentMembership: CurrentMembershipResponseDto | null
}

export class AuthContextService {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationUserRepository: OrganizationUserRepository,
        private readonly roleRepository: RoleRepository,
    ) {}

    async resolve(input: {
        userId: string
        organizationId: string | null
    }): Promise<CurrentAuthContext> {
        if (!input.organizationId) {
            return {
                currentOrganization: null,
                currentMembership: null,
            }
        }

        const organization = await this.organizationRepository.findById(
            input.organizationId,
        )

        if (!organization || !organization.isActive) {
            throw new NotFoundError('Organizacao nao encontrada')
        }

        const member =
            await this.organizationUserRepository.findActiveMemberByOrganizationAndUser(
                {
                    organizationId: organization.id,
                    userId: input.userId,
                },
            )

        if (!member) {
            throw new ForbiddenError(
                'Usuario sem vinculo ativo com a organizacao',
            )
        }

        const permissions =
            await this.roleRepository.listPermissionCodesForUser({
                organizationId: organization.id,
                userId: input.userId,
            })

        return {
            currentOrganization: toOrganizationResponseDto(organization),
            currentMembership: {
                organizationUserId: member.organizationUserId,
                userId: member.userId,
                status: 'ACTIVE',
                roles: member.roles,
                permissions,
                createdAt: member.createdAt.toISOString(),
            },
        }
    }
}
