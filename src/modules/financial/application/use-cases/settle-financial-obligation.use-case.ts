import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type {
    FinancialObligationKind,
    FinancialObligationRepository,
} from '../../domain/repositories/financial-obligation.repository'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialClock } from '../ports/financial-clock.port'
import type { FinancialObligationResponseDto } from '../dto'
import { currentFinancialDate } from '../date/financial-date'
import { toFinancialObligationResponseDto } from '../mappers/financial-response.mapper'
import {
    findObligationOrThrow,
    obligationNotFoundMessage,
    obligationType,
    validateSettlementDate,
} from './financial-obligation.helpers'

export class SettleFinancialObligationUseCase {
    constructor(
        private readonly repository: FinancialRepository,
        private readonly obligationRepository: FinancialObligationRepository,
        private readonly clock: FinancialClock,
        private readonly kind: FinancialObligationKind,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
        settlementDate: string
    }): Promise<FinancialObligationResponseDto> {
        const current = await findObligationOrThrow(this.obligationRepository, {
            ...input,
            kind: this.kind,
            clock: this.clock,
        })
        if (current.status !== 'PENDING') {
            throw new ConflictError(
                'Somente contas pendentes podem ser liquidadas',
            )
        }
        validateSettlementDate({
            settlementDate: input.settlementDate,
            transactionDate: current.transactionDate,
            clock: this.clock,
        })
        const account = await this.repository.findAccountById({
            id: current.accountId,
            organizationId: current.organizationId,
        })
        if (!account || account.status !== 'ACTIVE') {
            throw new ConflictError(
                'A conta financeira deve estar ativa para liquidacao',
            )
        }
        const updated = await this.repository.changeTransactionStatus({
            id: current.id,
            organizationId: current.organizationId,
            status: 'PAID',
            settlementDate: input.settlementDate,
        })
        if (!updated) {
            throw new NotFoundError(obligationNotFoundMessage(this.kind))
        }
        const obligation = await this.obligationRepository.findObligationById({
            id: updated.id,
            organizationId: current.organizationId,
            type: obligationType(this.kind),
            today: currentFinancialDate(this.clock),
        })
        if (!obligation) {
            throw new NotFoundError(obligationNotFoundMessage(this.kind))
        }
        return toFinancialObligationResponseDto(
            obligation,
            currentFinancialDate(this.clock),
        )
    }
}
