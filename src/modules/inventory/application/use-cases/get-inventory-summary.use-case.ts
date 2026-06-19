import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventorySummaryResponseDto } from '../dto'
import { toInventorySummaryResponseDto } from '../mappers/inventory-response.mapper'
import { requireInventoryOrganization } from './inventory-use-case.helpers'

export class GetInventorySummaryUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        organizationId: string | null
    }): Promise<InventorySummaryResponseDto> {
        const organizationId = requireInventoryOrganization(
            input.organizationId,
        )
        return toInventorySummaryResponseDto(
            await this.repository.getSummary(organizationId),
        )
    }
}
