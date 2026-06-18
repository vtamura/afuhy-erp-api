import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialAccountResponseDto } from '../dto'
import { toFinancialAccountResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class ListFinancialAccountsUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        organizationId: string | null
    }): Promise<FinancialAccountResponseDto[]> {
        const organizationId = requireOrganization(input.organizationId)
        const accounts = await this.repository.listAccounts(organizationId)
        return accounts.map(toFinancialAccountResponseDto)
    }
}
