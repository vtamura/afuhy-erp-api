import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import { findProductOrThrow } from './inventory-use-case.helpers'

export class DeleteInventoryProductUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<void> {
        const product = await findProductOrThrow(this.repository, input)
        if (
            await this.repository.productHasMovements({
                id: product.id,
                organizationId: product.organizationId,
            })
        ) {
            throw new ConflictError('Produto com movimentos deve ser inativado')
        }
        if (
            !(await this.repository.softDeleteProduct({
                id: product.id,
                organizationId: product.organizationId,
            }))
        ) {
            throw new NotFoundError('Produto nao encontrado')
        }
    }
}
