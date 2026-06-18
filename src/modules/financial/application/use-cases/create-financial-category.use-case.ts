import { ConflictError } from '../../../../shared/domain/errors'
import type {
    FinancialResourceStatus,
    FinancialTransactionType,
} from '../../domain/entities/financial.entity'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialCategoryResponseDto } from '../dto'
import { toFinancialCategoryResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class CreateFinancialCategoryUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        organizationId: string | null
        name: string
        type: FinancialTransactionType
        status: FinancialResourceStatus
    }): Promise<FinancialCategoryResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        if (
            await this.repository.findCategoryByNameAndType({
                organizationId,
                name: input.name,
                type: input.type,
            })
        ) {
            throw new ConflictError('Categoria financeira ja cadastrada')
        }
        const category = await this.repository.createCategory({
            ...input,
            organizationId,
        })
        return toFinancialCategoryResponseDto(category)
    }
}
