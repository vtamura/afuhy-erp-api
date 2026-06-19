import { ConflictError } from '../../../../shared/domain/errors'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryMovementResponseDto } from '../dto'
import { toInventoryMovementResponseDto } from '../mappers/inventory-response.mapper'
import { findMovementOrThrow } from './inventory-use-case.helpers'

export class ReverseInventoryMovementUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
        reason: string
        movementDate: Date
        createdBy: string
    }): Promise<InventoryMovementResponseDto> {
        const original = await findMovementOrThrow(this.repository, input)
        if (original.reversalOfMovementId) {
            throw new ConflictError('Um estorno nao pode ser estornado')
        }
        if (original.reversedByMovementId) {
            throw new ConflictError('Movimento ja estornado')
        }
        return toInventoryMovementResponseDto(
            await this.repository.reverseMovement({
                ...input,
                organizationId: original.organizationId,
            }),
        )
    }
}
