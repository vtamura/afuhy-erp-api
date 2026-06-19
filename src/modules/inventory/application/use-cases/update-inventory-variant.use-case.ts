import { NotFoundError } from '../../../../shared/domain/errors'
import type { InventoryStatus } from '../../domain/entities/inventory.entity'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryVariantResponseDto } from '../dto'
import { toInventoryVariantResponseDto } from '../mappers/inventory-response.mapper'
import {
    ensureVariantIdentifiersAvailable,
    findProductOrThrow,
    findVariantOrThrow,
} from './inventory-use-case.helpers'

export class UpdateInventoryVariantUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        id: string
        variantId: string
        organizationId: string | null
        name?: string
        sku?: string
        barcode?: string | null
        salePrice?: string
        minimumQuantity?: string
        status?: InventoryStatus
    }): Promise<InventoryVariantResponseDto> {
        const product = await findProductOrThrow(this.repository, input)
        const variant = await findVariantOrThrow(this.repository, {
            id: input.variantId,
            organizationId: product.organizationId,
        })
        if (variant.productId !== product.id) {
            throw new NotFoundError('Variante nao encontrada')
        }
        const data = {
            name: input.name ?? variant.name,
            sku: input.sku ?? variant.sku,
            barcode:
                input.barcode === undefined ? variant.barcode : input.barcode,
            salePrice: input.salePrice ?? variant.salePrice,
            minimumQuantity: input.minimumQuantity ?? variant.minimumQuantity,
            status: input.status ?? variant.status,
        }
        await ensureVariantIdentifiersAvailable(this.repository, {
            organizationId: product.organizationId,
            sku: data.sku,
            barcode: data.barcode,
            excludeVariantId: variant.id,
        })
        const updated = await this.repository.updateVariant({
            id: variant.id,
            productId: product.id,
            organizationId: product.organizationId,
            data,
        })
        if (!updated) throw new NotFoundError('Variante nao encontrada')
        return toInventoryVariantResponseDto(updated)
    }
}
