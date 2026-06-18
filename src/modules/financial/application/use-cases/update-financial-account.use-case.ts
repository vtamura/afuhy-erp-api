import { NotFoundError } from '../../../../shared/domain/errors'
import type {
    FinancialAccountType,
    FinancialResourceStatus,
} from '../../domain/entities/financial.entity'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialAccountResponseDto } from '../dto'
import { toFinancialAccountResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'

export class UpdateFinancialAccountUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
        name?: string
        type?: FinancialAccountType
        initialBalance?: string
        status?: FinancialResourceStatus
    }): Promise<FinancialAccountResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const current = await this.repository.findAccountById({
            id: input.id,
            organizationId,
        })
        if (!current) {
            throw new NotFoundError('Conta financeira nao encontrada')
        }
        const updated = await this.repository.updateAccount({
            id: input.id,
            organizationId,
            data: {
                name: input.name ?? current.name,
                type: input.type ?? current.type,
                initialBalance: input.initialBalance ?? current.initialBalance,
                status: input.status ?? current.status,
            },
        })
        if (!updated) {
            throw new NotFoundError('Conta financeira nao encontrada')
        }
        return toFinancialAccountResponseDto(updated)
    }
}
