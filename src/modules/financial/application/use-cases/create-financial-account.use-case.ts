import type {
    FinancialAccountType,
    FinancialResourceStatus,
} from '../../domain/entities/financial.entity'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialAccountResponseDto } from '../dto'
import { toFinancialAccountResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class CreateFinancialAccountUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        organizationId: string | null
        name: string
        type: FinancialAccountType
        initialBalance: string
        status: FinancialResourceStatus
    }): Promise<FinancialAccountResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const account = await this.repository.createAccount({
            ...input,
            organizationId,
        })
        return toFinancialAccountResponseDto(account)
    }
}
