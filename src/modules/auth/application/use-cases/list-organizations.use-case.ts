import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { OrganizationResponseDto } from '../dto'
import { toOrganizationResponseDto } from '../mappers/organization-response.mapper'

export class ListOrganizationsUseCase {
    constructor(
        private readonly organizationRepository: OrganizationRepository,
    ) {}

    async execute(userId: string): Promise<OrganizationResponseDto[]> {
        const organizations =
            await this.organizationRepository.listByUserId(userId)

        return organizations.map(toOrganizationResponseDto)
    }
}
