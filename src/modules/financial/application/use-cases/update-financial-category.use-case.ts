import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type {
    FinancialResourceStatus,
    FinancialTransactionType,
} from '../../domain/entities/financial.entity'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialCategoryResponseDto } from '../dto'
import { toFinancialCategoryResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class UpdateFinancialCategoryUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
        name?: string
        type?: FinancialTransactionType
        status?: FinancialResourceStatus
    }): Promise<FinancialCategoryResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const current = await this.repository.findCategoryById({
            id: input.id,
            organizationId,
        })
        if (!current) {
            throw new NotFoundError('Categoria financeira nao encontrada')
        }
        const name = input.name ?? current.name
        const type = input.type ?? current.type
        const duplicate = await this.repository.findCategoryByNameAndType({
            organizationId,
            name,
            type,
        })
        if (duplicate && duplicate.id !== input.id) {
            throw new ConflictError('Categoria financeira ja cadastrada')
        }
        const updated = await this.repository.updateCategory({
            id: input.id,
            organizationId,
            data: {
                name,
                type,
                status: input.status ?? current.status,
            },
        })
        if (!updated) {
            throw new NotFoundError('Categoria financeira nao encontrada')
        }
        return toFinancialCategoryResponseDto(updated)
    }
}
