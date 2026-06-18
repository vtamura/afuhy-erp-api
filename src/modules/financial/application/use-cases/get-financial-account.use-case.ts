import { NotFoundError } from '../../../../shared/domain/errors'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialAccountResponseDto } from '../dto'
import { toFinancialAccountResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class GetFinancialAccountUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialAccountResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const account = await this.repository.findAccountById({
            id: input.id,
            organizationId,
        })
        if (!account) {
            throw new NotFoundError('Conta financeira nao encontrada')
        }
        return toFinancialAccountResponseDto(account)
    }
}
