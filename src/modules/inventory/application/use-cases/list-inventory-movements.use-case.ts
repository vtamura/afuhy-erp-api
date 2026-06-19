import type { InventoryMovementType } from '../../domain/entities/inventory.entity'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryMovementListResponseDto } from '../dto'
import { toInventoryMovementResponseDto } from '../mappers/inventory-response.mapper'
import { requireInventoryOrganization } from './inventory-use-case.helpers'

export class ListInventoryMovementsUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        organizationId: string | null
        productId?: string
        variantId?: string
        type?: InventoryMovementType
        supplierId?: string
        startDate?: Date
        endDate?: Date
        page: number
        pageSize: number
    }): Promise<InventoryMovementListResponseDto> {
        const organizationId = requireInventoryOrganization(
            input.organizationId,
        )
        const result = await this.repository.listMovements(
            { ...input, organizationId },
            { page: input.page, pageSize: input.pageSize },
        )
        return {
            items: result.items.map(toInventoryMovementResponseDto),
            pagination: {
                page: input.page,
                pageSize: input.pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / input.pageSize),
            },
        }
    }
}
