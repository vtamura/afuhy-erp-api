import {
    BadRequestError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import {
    moneyToCents,
    quantityToMillis,
} from '../../domain/decimal/inventory-decimal'
import type { InventoryRepository } from '../../domain/repositories/inventory.repository'
import type { InventoryMovementResponseDto } from '../dto'
import { toInventoryMovementResponseDto } from '../mappers/inventory-response.mapper'
import { requireInventoryOrganization } from './inventory-use-case.helpers'

export class CreateInventoryMovementUseCase {
    constructor(private readonly repository: InventoryRepository) {}

    async execute(input: {
        organizationId: string | null
        variantId: string
        type: 'ENTRY' | 'EXIT'
        quantity: string
        unitCost: string | null
        supplierId: string | null
        reason: string | null
        notes: string | null
        movementDate: Date
        createdBy: string
    }): Promise<InventoryMovementResponseDto> {
        const organizationId = requireInventoryOrganization(
            input.organizationId,
        )
        if (quantityToMillis(input.quantity) <= 0n) {
            throw new BadRequestError('Quantidade deve ser maior que zero')
        }
        if (input.type === 'ENTRY' && input.unitCost == null) {
            throw new BadRequestError(
                'Custo unitario e obrigatorio para entradas',
            )
        }
        if (
            input.type === 'ENTRY' &&
            input.unitCost != null &&
            moneyToCents(input.unitCost) < 0n
        ) {
            throw new BadRequestError('Custo unitario nao pode ser negativo')
        }
        if (input.type === 'EXIT' && input.supplierId) {
            throw new BadRequestError(
                'Fornecedor nao pode ser informado em saidas',
            )
        }
        if (
            input.supplierId &&
            !(await this.repository.supplierIsActive({
                id: input.supplierId,
                organizationId,
            }))
        ) {
            throw new NotFoundError('Fornecedor ativo nao encontrado')
        }
        return toInventoryMovementResponseDto(
            await this.repository.createMovement({
                ...input,
                organizationId,
            }),
        )
    }
}
