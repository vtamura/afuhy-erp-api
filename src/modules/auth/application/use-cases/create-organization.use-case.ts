import { ConflictError } from '../../../../shared/domain/errors'
import type { OrganizationDocumentType } from '../../domain/entities/organization.entity'
import { DEFAULT_ORGANIZATION_ROLES } from '../../domain/rbac/default-rbac'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationUserRepository } from '../../domain/repositories/organization-user.repository'
import type { RoleRepository } from '../../domain/repositories/role.repository'
import type { OrganizationResponseDto } from '../dto'
import { toOrganizationResponseDto } from '../mappers/organization-response.mapper'

type CreateOrganizationUseCaseInput = {
    name: string
    document: string
    documentType: OrganizationDocumentType
    userId: string
}

export class CreateOrganizationUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
        private readonly organizationUserRepository: OrganizationUserRepository,
        private readonly roleRepository: RoleRepository,
    ) {}

    async execute(
        input: CreateOrganizationUseCaseInput,
    ): Promise<OrganizationResponseDto> {
        const existingOrganization =
            await this.organizationRepository.findByDocument(input.document)

        if (existingOrganization) {
            throw new ConflictError('Documento da organizacao ja cadastrado')
        }

        const organization = await this.organizationRepository.create({
            name: input.name,
            document: input.document,
            documentType: input.documentType,
        })
        const organizationUser = await this.organizationUserRepository.create({
            organizationId: organization.id,
            userId: input.userId,
        })
        const roles = await this.roleRepository.ensureDefaultOrganizationRoles(
            DEFAULT_ORGANIZATION_ROLES.map((role) => ({
                organizationId: organization.id,
                code: role.code,
                name: role.name,
                permissionCodes: role.permissions,
            })),
        )
        const adminRole =
            roles.find((role) => role.code === 'ADMIN') ??
            (await this.roleRepository.findByOrganizationAndCode({
                organizationId: organization.id,
                code: 'ADMIN',
            }))

        if (!adminRole) {
            throw new Error('Admin role could not be ensured')
        }

        await this.roleRepository.assignRoleToOrganizationUser({
            organizationUserId: organizationUser.id,
            roleId: adminRole.id,
        })

        return toOrganizationResponseDto(organization)
    }
}
