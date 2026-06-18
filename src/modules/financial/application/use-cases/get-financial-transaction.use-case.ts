import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialTransactionResponseDto } from '../dto'
import { toFinancialTransactionResponseDto } from '../mappers/financial-response.mapper'
import { findTransactionOrThrow } from './financial-use-case.helpers'

export class GetFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialTransactionResponseDto> {
        const transaction = await findTransactionOrThrow(this.repository, input)
        return toFinancialTransactionResponseDto(transaction)
    }
}
