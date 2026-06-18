import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialTransactionResponseDto } from '../dto'
import { toFinancialTransactionResponseDto } from '../mappers/financial-response.mapper'
import { findTransactionOrThrow } from './financial-use-case.helpers'

export class CancelFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialTransactionResponseDto> {
        const current = await findTransactionOrThrow(this.repository, input)
        if (current.status === 'CANCELED') {
            throw new ConflictError('Lancamento ja esta cancelado')
        }
        const updated = await this.repository.changeTransactionStatus({
            id: current.id,
            organizationId: current.organizationId,
            status: 'CANCELED',
        })
        if (!updated) {
            throw new NotFoundError('Lancamento financeiro nao encontrado')
        }
        return toFinancialTransactionResponseDto(updated)
    }
}
