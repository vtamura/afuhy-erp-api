import { NotFoundError } from '../../../../shared/domain/errors'
import type {
    InventoryStatus,
    InventoryUnit,
} from '../../domain/entities/inventory.entity'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryProductResponseDto } from '../dto'
import { toInventoryProductResponseDto } from '../mappers/inventory-response.mapper'
import { findProductOrThrow } from './inventory-use-case.helpers'

export class UpdateInventoryProductUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
        name?: string
        description?: string | null
        unit?: InventoryUnit
        status?: InventoryStatus
    }): Promise<InventoryProductResponseDto> {
        const current = await findProductOrThrow(this.repository, input)
        const updated = await this.repository.updateProduct({
            id: current.id,
            organizationId: current.organizationId,
            data: {
                name: input.name ?? current.name,
                description:
                    input.description === undefined
                        ? current.description
                        : input.description,
                unit: input.unit ?? current.unit,
                status: input.status ?? current.status,
            },
        })
        if (!updated) throw new NotFoundError('Produto nao encontrado')
        return toInventoryProductResponseDto(updated)
    }
}
