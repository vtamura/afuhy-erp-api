import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import {
    findProductOrThrow,
    findVariantOrThrow,
} from './inventory-use-case.helpers'

export class DeleteInventoryVariantUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        id: string
        variantId: string
        organizationId: string | null
    }): Promise<void> {
        const product = await findProductOrThrow(this.repository, input)
        const variant = await findVariantOrThrow(this.repository, {
            id: input.variantId,
            organizationId: product.organizationId,
        })
        if (variant.productId !== product.id) {
            throw new NotFoundError('Variante nao encontrada')
        }
        if (
            await this.repository.variantHasMovements({
                id: variant.id,
                organizationId: product.organizationId,
            })
        ) {
            throw new ConflictError(
                'Variante com movimentos deve ser inativada',
            )
        }
        if (
            (await this.repository.countActiveVariants({
                productId: product.id,
                organizationId: product.organizationId,
            })) <= 1
        ) {
            throw new ConflictError(
                'Produto deve possuir ao menos uma variante',
            )
        }
        if (
            !(await this.repository.softDeleteVariant({
                id: variant.id,
                productId: product.id,
                organizationId: product.organizationId,
            }))
        ) {
            throw new NotFoundError('Variante nao encontrada')
        }
    }
}
