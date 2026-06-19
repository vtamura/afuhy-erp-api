import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type {
    InventoryMovementEntity,
    InventoryProductEntity,
    InventoryVariantEntity,
} from '../../domain/entities/inventory.entity'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'

export function requireInventoryOrganization(
    organizationId: string | null,
): string {
    if (!organizationId) {
        throw new ForbiddenError('Organizacao nao selecionada')
    }
    return organizationId
}

export async function findProductOrThrow(
    repository: InventoryRepository,
    input: { id: string; organizationId: string | null },
): Promise<InventoryProductEntity> {
    const organizationId = requireInventoryOrganization(input.organizationId)
    const product = await repository.findProductById({
        id: input.id,
        organizationId,
    })
    if (!product) throw new NotFoundError('Produto nao encontrado')
    return product
}

export async function findVariantOrThrow(
    repository: InventoryRepository,
    input: { id: string; organizationId: string | null },
): Promise<InventoryVariantEntity> {
    const organizationId = requireInventoryOrganization(input.organizationId)
    const variant = await repository.findVariantById({
        id: input.id,
        organizationId,
    })
    if (!variant) throw new NotFoundError('Variante nao encontrada')
    return variant
}

export async function findMovementOrThrow(
    repository: InventoryRepository,
    input: { id: string; organizationId: string | null },
): Promise<InventoryMovementEntity> {
    const organizationId = requireInventoryOrganization(input.organizationId)
    const movement = await repository.findMovementById({
        id: input.id,
        organizationId,
    })
    if (!movement) throw new NotFoundError('Movimento nao encontrado')
    return movement
}

export async function ensureVariantIdentifiersAvailable(
    repository: InventoryRepository,
    input: {
        organizationId: string
        sku: string
        barcode: string | null
        excludeVariantId?: string
    },
): Promise<void> {
    const sku = await repository.findVariantBySku({
        organizationId: input.organizationId,
        sku: input.sku,
    })
    if (sku && sku.id !== input.excludeVariantId) {
        throw new ConflictError('SKU ja cadastrado na organizacao')
    }
    if (input.barcode) {
        const barcode = await repository.findVariantByBarcode({
            organizationId: input.organizationId,
            barcode: input.barcode,
        })
        if (barcode && barcode.id !== input.excludeVariantId) {
            throw new ConflictError(
                'Codigo de barras ja cadastrado na organizacao',
            )
        }
    }
}
