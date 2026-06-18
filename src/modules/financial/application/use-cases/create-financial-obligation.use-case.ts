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
    requireOrganization,
    validateTransactionReferences,
} from './financial-use-case.helpers'
import {
    obligationCounterparties,
    obligationNotFoundMessage,
    obligationType,
    validateDueDate,
} from './financial-obligation.helpers'
import { NotFoundError } from '../../../../shared/domain/errors'

export class CreateFinancialObligationUseCase {
    constructor(
        private readonly repository: FinancialRepository,
        private readonly obligationRepository: FinancialObligationRepository,
        private readonly clock: FinancialClock,
        private readonly kind: FinancialObligationKind,
    ) {}

    async execute(input: {
        organizationId: string | null
        createdBy: string
        accountId: string
        categoryId: string
        counterpartyId: string | null
        description: string
        notes: string | null
        amount: string
        transactionDate: string
        dueDate: string
    }): Promise<FinancialObligationResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const type = obligationType(this.kind)
        const counterparties = obligationCounterparties(
            this.kind,
            input.counterpartyId,
        )
        validateDueDate(input.transactionDate, input.dueDate)
        const data = {
            organizationId,
            createdBy: input.createdBy,
            accountId: input.accountId,
            categoryId: input.categoryId,
            ...counterparties,
            description: input.description,
            notes: input.notes,
            type,
            amount: input.amount,
            transactionDate: input.transactionDate,
            dueDate: input.dueDate,
        }
        await validateTransactionReferences(this.repository, data)
        const transaction = await this.repository.createTransaction(data)
        const obligation = await this.obligationRepository.findObligationById({
            id: transaction.id,
            organizationId,
            type,
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
