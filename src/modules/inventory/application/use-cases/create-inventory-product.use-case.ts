import {
    BadRequestError,
    ConflictError,
} from '../../../../shared/domain/errors'
import type {
    InventoryStatus,
    InventoryUnit,
} from '../../domain/entities/inventory.entity'
import type {
    InventoryRepository,
    InventoryVariantData,
} from '../../domain/repositories/inventory.repository'
import type { InventoryProductResponseDto } from '../dto'
import { toInventoryProductResponseDto } from '../mappers/inventory-response.mapper'
import {
    ensureVariantIdentifiersAvailable,
    requireInventoryOrganization,
} from './inventory-use-case.helpers'

export class CreateInventoryProductUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        organizationId: string | null
        name: string
        description: string | null
        unit: InventoryUnit
        status: InventoryStatus
        variants: InventoryVariantData[]
    }): Promise<InventoryProductResponseDto> {
        const organizationId = requireInventoryOrganization(
            input.organizationId,
        )
        if (input.variants.length === 0) {
            throw new BadRequestError(
                'Produto deve possuir ao menos uma variante',
            )
        }
        const skus = new Set<string>()
        const barcodes = new Set<string>()
        for (const variant of input.variants) {
            if (skus.has(variant.sku)) {
                throw new ConflictError('SKU duplicado no produto')
            }
            skus.add(variant.sku)
            if (variant.barcode) {
                if (barcodes.has(variant.barcode)) {
                    throw new ConflictError(
                        'Codigo de barras duplicado no produto',
                    )
                }
                barcodes.add(variant.barcode)
            }
            await ensureVariantIdentifiersAvailable(this.repository, {
                organizationId,
                sku: variant.sku,
                barcode: variant.barcode,
            })
        }
        return toInventoryProductResponseDto(
            await this.repository.createProduct({
                ...input,
                organizationId,
            }),
        )
    }
}
