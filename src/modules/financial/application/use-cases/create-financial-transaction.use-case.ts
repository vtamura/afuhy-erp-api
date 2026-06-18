import type {
    FinancialRepository,
    FinancialTransactionData,
} from '../../domain/repositories/financial.repository'
import type { FinancialTransactionResponseDto } from '../dto'
import { toFinancialTransactionResponseDto } from '../mappers/financial-response.mapper'
import {
    requireOrganization,
    validateTransactionReferences,
} from './financial-use-case.helpers'

export class CreateFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(
        input: Omit<
            FinancialTransactionData,
            'organizationId' | 'createdBy'
        > & {
            organizationId: string | null
            createdBy: string
        },
    ): Promise<FinancialTransactionResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        await validateTransactionReferences(this.repository, {
            ...input,
            organizationId,
        })
        const transaction = await this.repository.createTransaction({
            ...input,
            organizationId,
        })
        return toFinancialTransactionResponseDto(transaction)
    }
}
