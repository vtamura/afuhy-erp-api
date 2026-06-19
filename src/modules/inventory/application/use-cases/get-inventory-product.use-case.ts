import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryProductResponseDto } from '../dto'
import { toInventoryProductResponseDto } from '../mappers/inventory-response.mapper'
import { findProductOrThrow } from './inventory-use-case.helpers'

export class GetInventoryProductUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<InventoryProductResponseDto> {
        return toInventoryProductResponseDto(
            await findProductOrThrow(this.repository, input),
        )
    }
}
