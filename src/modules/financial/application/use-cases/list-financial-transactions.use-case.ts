import type {
    FinancialRepository,
    FinancialTransactionFilters,
} from '../../domain/repositories/financial.repository'
import type { FinancialTransactionListResponseDto } from '../dto'
import { toFinancialTransactionResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class ListFinancialTransactionsUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(
        input: Omit<FinancialTransactionFilters, 'organizationId'> & {
            organizationId: string | null
            page: number
            pageSize: number
        },
    ): Promise<FinancialTransactionListResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const { page, pageSize, ...filters } = input
        const result = await this.repository.listTransactions(
            { ...filters, organizationId },
            { page, pageSize },
        )
        return {
            items: result.items.map(toFinancialTransactionResponseDto),
            pagination: {
                page,
                pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / pageSize),
            },
            summary: result.summary,
        }
    }
}
