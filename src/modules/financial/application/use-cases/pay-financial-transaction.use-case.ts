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
        accountId?: string
    }): Promise<FinancialTransactionResponseDto> {
        const current = await findTransactionOrThrow(this.repository, input)
        if (current.status !== 'PENDING') {
            throw new ConflictError(
                'Somente lancamentos pendentes podem ser pagos',
            )
        }
        const accountId = input.accountId ?? current.accountId
        if (!accountId) {
            throw new ConflictError(
                'Conta financeira e obrigatoria para pagamento',
            )
        }
        const account = await this.repository.findAccountById({
            id: accountId,
            organizationId: current.organizationId,
        })
        if (!account || account.status !== 'ACTIVE') {
            throw new ConflictError(
                'A conta financeira deve estar ativa para pagamento',
            )
        }
        const updated = await this.repository.changeTransactionStatus({
            id: current.id,
            organizationId: current.organizationId,
            status: 'PAID',
            settlementDate:
                input.settlementDate ?? currentFinancialDate(this.clock),
            accountId,
        })
        if (!updated) {
            throw new NotFoundError('Lancamento financeiro nao encontrado')
        }
        return toFinancialTransactionResponseDto(updated)
    }
}
