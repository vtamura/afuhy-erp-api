import { ConflictError } from '../../../../shared/domain/errors'
import type { OrganizationDocumentType } from '../../domain/entities/organization.entity'
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

const ADMIN_ROLE_CODE = 'ADMIN'

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
        const adminRole =
            (await this.roleRepository.findByOrganizationAndCode({
                organizationId: organization.id,
                code: ADMIN_ROLE_CODE,
            })) ??
            (await this.roleRepository.createOrganizationRole({
                organizationId: organization.id,
                name: 'Administrador',
                code: ADMIN_ROLE_CODE,
            }))

        await this.roleRepository.assignRoleToOrganizationUser({
            organizationUserId: organizationUser.id,
            roleId: adminRole.id,
        })

        return toOrganizationResponseDto(organization)
    }
}
