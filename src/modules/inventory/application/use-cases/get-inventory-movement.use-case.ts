import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryMovementResponseDto } from '../dto'
import { toInventoryMovementResponseDto } from '../mappers/inventory-response.mapper'
import { findMovementOrThrow } from './inventory-use-case.helpers'

export class GetInventoryMovementUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<InventoryMovementResponseDto> {
        return toInventoryMovementResponseDto(
            await findMovementOrThrow(this.repository, input),
        )
    }
}
