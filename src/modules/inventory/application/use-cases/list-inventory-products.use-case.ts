import type { InventoryStatus } from '../../domain/entities/inventory.entity'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryProductListResponseDto } from '../dto'
import { toInventoryProductResponseDto } from '../mappers/inventory-response.mapper'
import { requireInventoryOrganization } from './inventory-use-case.helpers'

export class ListInventoryProductsUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        organizationId: string | null
        status?: InventoryStatus
        search?: string
        lowStock?: boolean
        page: number
        pageSize: number
    }): Promise<InventoryProductListResponseDto> {
        const organizationId = requireInventoryOrganization(
            input.organizationId,
        )
        const result = await this.repository.listProducts(
            {
                organizationId,
                status: input.status,
                search: input.search,
                lowStock: input.lowStock,
            },
            { page: input.page, pageSize: input.pageSize },
        )
        return {
            items: result.items.map(toInventoryProductResponseDto),
            pagination: {
                page: input.page,
                pageSize: input.pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / input.pageSize),
            },
        }
    }
}
