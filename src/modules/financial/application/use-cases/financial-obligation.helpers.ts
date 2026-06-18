import {
    BadRequestError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type { FinancialTransactionType } from '../../domain/entities/financial.entity'
import type {
    FinancialObligationEntity,
    FinancialObligationKind,
    FinancialObligationRepository,
} from '../../domain/repositories/financial-obligation.repository'
import type { FinancialClock } from '../ports/financial-clock.port'
import { currentFinancialDate } from '../date/financial-date'
import { requireOrganization } from './financial-use-case.helpers'

export function obligationType(
    kind: FinancialObligationKind,
): FinancialTransactionType {
    return kind === 'payable' ? 'EXPENSE' : 'INCOME'
}

export function obligationCounterparties(
    kind: FinancialObligationKind,
    counterpartyId: string | null,
) {
    return {
        customerId: kind === 'receivable' ? counterpartyId : null,
        supplierId: kind === 'payable' ? counterpartyId : null,
    }
}

export async function findObligationOrThrow(
    repository: FinancialObligationRepository,
    input: {
        id: string
        organizationId: string | null
        kind: FinancialObligationKind
        clock: FinancialClock
    },
): Promise<FinancialObligationEntity> {
    const organizationId = requireOrganization(input.organizationId)
    const obligation = await repository.findObligationById({
        id: input.id,
        organizationId,
        type: obligationType(input.kind),
        today: currentFinancialDate(input.clock),
    })

    if (!obligation) {
        throw new NotFoundError(obligationNotFoundMessage(input.kind))
    }

    return obligation
}

export function validateDueDate(
    transactionDate: string,
    dueDate: string,
): void {
    if (dueDate < transactionDate) {
        throw new BadRequestError(
            'Vencimento deve ser igual ou posterior a data do lancamento',
        )
    }
}

export function validateSettlementDate(input: {
    settlementDate: string
    transactionDate: string
    clock: FinancialClock
}): void {
    if (input.settlementDate < input.transactionDate) {
        throw new BadRequestError(
            'Data de liquidacao deve ser igual ou posterior a data do lancamento',
        )
    }

    if (input.settlementDate > currentFinancialDate(input.clock)) {
        throw new BadRequestError('Data de liquidacao nao pode estar no futuro')
    }
}

export function obligationNotFoundMessage(
    kind: FinancialObligationKind,
): string {
    return kind === 'payable'
        ? 'Conta a pagar nao encontrada'
        : 'Conta a receber nao encontrada'
}
