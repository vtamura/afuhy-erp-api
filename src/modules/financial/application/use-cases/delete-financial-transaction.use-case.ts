import { ConflictError } from '../../../../shared/domain/errors'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import { findTransactionOrThrow } from './financial-use-case.helpers'

export class DeleteFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<void> {
        const current = await findTransactionOrThrow(this.repository, input)
        if (current.status === 'PAID') {
            throw new ConflictError(
                'Lancamento pago deve ser cancelado antes da exclusao',
            )
        }
        await this.repository.softDeleteTransaction({
            id: current.id,
            organizationId: current.organizationId,
        })
    }
}
