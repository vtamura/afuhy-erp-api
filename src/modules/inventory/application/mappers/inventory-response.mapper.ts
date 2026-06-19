import type {
    InventoryMovementEntity,
    InventoryProductEntity,
    InventorySummaryEntity,
    InventoryVariantEntity,
} from '../../domain/entities/inventory.entity'
import {
    calculateTotalCost,
    centsToMoney,
    millisToQuantity,
    moneyToCents,
    quantityToMillis,
} from '../../domain/decimal/inventory-decimal'
import type {
    InventoryMovementResponseDto,
    InventoryProductResponseDto,
    InventorySummaryResponseDto,
    InventoryVariantResponseDto,
} from '../dto'

export function toInventoryVariantResponseDto(
    entity: InventoryVariantEntity,
): InventoryVariantResponseDto {
    return {
        ...entity,
        inventoryValue: calculateTotalCost(
            entity.currentQuantity,
            entity.averageCost,
        ),
        isLowStock:
            quantityToMillis(entity.currentQuantity) <
            quantityToMillis(entity.minimumQuantity),
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
        deletedAt: entity.deletedAt?.toISOString() ?? null,
    }
}

export function toInventoryProductResponseDto(
    entity: InventoryProductEntity,
): InventoryProductResponseDto {
    const variants = entity.variants.map(toInventoryVariantResponseDto)
    return {
        ...entity,
        variants,
        totalQuantity: millisToQuantity(
            entity.variants.reduce(
                (total, variant) =>
                    total + quantityToMillis(variant.currentQuantity),
                0n,
            ),
        ),
        totalValue: centsToMoney(
            variants.reduce(
                (total, variant) =>
                    total + moneyToCents(variant.inventoryValue),
                0n,
            ),
        ),
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
        deletedAt: entity.deletedAt?.toISOString() ?? null,
    }
}

export function toInventoryMovementResponseDto(
    entity: InventoryMovementEntity,
): InventoryMovementResponseDto {
    return {
        ...entity,
        movementDate: entity.movementDate.toISOString(),
        createdAt: entity.createdAt.toISOString(),
    }
}

export function toInventorySummaryResponseDto(
    entity: InventorySummaryEntity,
): InventorySummaryResponseDto {
    return entity
}
