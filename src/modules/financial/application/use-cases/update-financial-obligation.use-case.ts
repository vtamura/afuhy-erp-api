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
import { validateTransactionReferences } from './financial-use-case.helpers'
import {
    findObligationOrThrow,
    obligationCounterparties,
    obligationNotFoundMessage,
    obligationType,
    validateDueDate,
} from './financial-obligation.helpers'

export class UpdateFinancialObligationUseCase {
    constructor(
        private readonly repository: FinancialRepository,
        private readonly obligationRepository: FinancialObligationRepository,
        private readonly clock: FinancialClock,
        private readonly kind: FinancialObligationKind,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
        accountId?: string
        categoryId?: string
        counterpartyId?: string | null
        description?: string
        notes?: string | null
        amount?: string
        transactionDate?: string
        dueDate?: string
    }): Promise<FinancialObligationResponseDto> {
        const current = await findObligationOrThrow(this.obligationRepository, {
            id: input.id,
            organizationId: input.organizationId,
            kind: this.kind,
            clock: this.clock,
        })
        if (current.status !== 'PENDING') {
            throw new ConflictError(
                'Somente contas pendentes podem ser editadas',
            )
        }
        const counterpartyId =
            input.counterpartyId === undefined
                ? (current.counterparty?.id ?? null)
                : input.counterpartyId
        const data = {
            accountId: input.accountId ?? current.accountId,
            categoryId: input.categoryId ?? current.categoryId,
            ...obligationCounterparties(this.kind, counterpartyId),
            description: input.description ?? current.description,
            notes: input.notes === undefined ? current.notes : input.notes,
            type: obligationType(this.kind),
            amount: input.amount ?? current.amount,
            transactionDate: input.transactionDate ?? current.transactionDate,
            dueDate: input.dueDate ?? current.dueDate!,
        }
        validateDueDate(data.transactionDate, data.dueDate)
        await validateTransactionReferences(this.repository, {
            ...data,
            organizationId: current.organizationId,
            createdBy: current.createdBy,
        })
        const updated = await this.repository.updateTransaction({
            id: current.id,
            organizationId: current.organizationId,
            data,
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
