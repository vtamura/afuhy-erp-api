import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialClock } from '../ports/financial-clock.port'
import { currentFinancialDate } from '../date/financial-date'
import type { FinancialTransactionResponseDto } from '../dto'
import { toFinancialTransactionResponseDto } from '../mappers/financial-response.mapper'
import { findTransactionOrThrow } from './financial-use-case.helpers'

export class PayFinancialTransactionUseCase {
    constructor(
        private readonly repository: FinancialRepository,
        private readonly clock: FinancialClock,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
        settlementDate?: string
    }): Promise<FinancialTransactionResponseDto> {
        const current = await findTransactionOrThrow(this.repository, input)
        if (current.status !== 'PENDING') {
            throw new ConflictError(
                'Somente lancamentos pendentes podem ser pagos',
            )
        }
        const updated = await this.repository.changeTransactionStatus({
            id: current.id,
            organizationId: current.organizationId,
            status: 'PAID',
            settlementDate:
                input.settlementDate ?? currentFinancialDate(this.clock),
        })
        if (!updated) {
            throw new NotFoundError('Lancamento financeiro nao encontrado')
        }
        return toFinancialTransactionResponseDto(updated)
    }
}
