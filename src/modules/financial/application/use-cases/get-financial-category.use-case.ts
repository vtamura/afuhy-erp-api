import { NotFoundError } from '../../../../shared/domain/errors'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialCategoryResponseDto } from '../dto'
import { toFinancialCategoryResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class GetFinancialCategoryUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialCategoryResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const category = await this.repository.findCategoryById({
            id: input.id,
            organizationId,
        })
        if (!category) {
            throw new NotFoundError('Categoria financeira nao encontrada')
        }
        return toFinancialCategoryResponseDto(category)
    }
}
