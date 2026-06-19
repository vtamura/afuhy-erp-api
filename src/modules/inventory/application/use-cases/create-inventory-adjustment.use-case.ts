import {
    BadRequestError,
    ConflictError,
} from '../../../../shared/domain/errors'
import { quantityToMillis } from '../../domain/decimal/inventory-decimal'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryMovementResponseDto } from '../dto'
import { toInventoryMovementResponseDto } from '../mappers/inventory-response.mapper'
import {
    findVariantOrThrow,
    requireInventoryOrganization,
} from './inventory-use-case.helpers'

export class CreateInventoryAdjustmentUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        organizationId: string | null
        variantId: string
        countedQuantity: string
        unitCost: string | null
        reason: string
        notes: string | null
        movementDate: Date
        createdBy: string
    }): Promise<InventoryMovementResponseDto> {
        const organizationId = requireInventoryOrganization(
            input.organizationId,
        )
        const variant = await findVariantOrThrow(this.repository, {
            id: input.variantId,
            organizationId,
        })
        const increase =
            quantityToMillis(input.countedQuantity) >
            quantityToMillis(variant.currentQuantity)
        if (
            increase &&
            variant.averageCost === '0.00' &&
            input.unitCost == null
        ) {
            throw new BadRequestError(
                'Custo unitario e obrigatorio para aumentar estoque sem custo medio',
            )
        }
        const movement = await this.repository.createAdjustment({
            ...input,
            organizationId,
        })
        if (!movement) {
            throw new ConflictError('Contagem informada e igual ao saldo atual')
        }
        return toInventoryMovementResponseDto(movement)
    }
}
