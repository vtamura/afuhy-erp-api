import { ConflictError } from '../../../../shared/domain/errors'
import type { InventoryStatus } from '../../domain/entities/inventory.entity'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryVariantResponseDto } from '../dto'
import { toInventoryVariantResponseDto } from '../mappers/inventory-response.mapper'
import {
    ensureVariantIdentifiersAvailable,
    findProductOrThrow,
} from './inventory-use-case.helpers'

export class AddInventoryVariantUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
        name: string
        sku: string
        barcode: string | null
        salePrice: string
        minimumQuantity: string
        status: InventoryStatus
    }): Promise<InventoryVariantResponseDto> {
        const product = await findProductOrThrow(this.repository, input)
        if (product.status !== 'ACTIVE') {
            throw new ConflictError(
                'Produto inativo nao pode receber variantes',
            )
        }
        await ensureVariantIdentifiersAvailable(this.repository, {
            organizationId: product.organizationId,
            sku: input.sku,
            barcode: input.barcode,
        })
        return toInventoryVariantResponseDto(
            await this.repository.addVariant({
                organizationId: product.organizationId,
                productId: product.id,
                data: {
                    name: input.name,
                    sku: input.sku,
                    barcode: input.barcode,
                    salePrice: input.salePrice,
                    minimumQuantity: input.minimumQuantity,
                    status: input.status,
                },
            }),
        )
    }
}
