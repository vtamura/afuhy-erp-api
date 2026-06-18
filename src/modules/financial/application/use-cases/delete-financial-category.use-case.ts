import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import { requireOrganization } from './financial-use-case.helpers'

export class DeleteFinancialCategoryUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<void> {
        const organizationId = requireOrganization(input.organizationId)
        const category = await this.repository.findCategoryById({
            id: input.id,
            organizationId,
        })
        if (!category) {
            throw new NotFoundError('Categoria financeira nao encontrada')
        }
        if (
            await this.repository.categoryHasTransactions({
                id: input.id,
                organizationId,
            })
        ) {
            throw new ConflictError(
                'Categoria possui lancamentos e deve ser inativada',
            )
        }
        await this.repository.softDeleteCategory({
            id: input.id,
            organizationId,
        })
    }
}
