import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialCategoryResponseDto } from '../dto'
import { toFinancialCategoryResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class ListFinancialCategoriesUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        organizationId: string | null
    }): Promise<FinancialCategoryResponseDto[]> {
        const organizationId = requireOrganization(input.organizationId)
        const categories = await this.repository.listCategories(organizationId)
        return categories.map(toFinancialCategoryResponseDto)
    }
}
