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
} from './financial-obligation.helpers'

export class CancelFinancialObligationUseCase {
    constructor(
        private readonly repository: FinancialRepository,
        private readonly obligationRepository: FinancialObligationRepository,
        private readonly clock: FinancialClock,
        private readonly kind: FinancialObligationKind,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialObligationResponseDto> {
        const current = await findObligationOrThrow(this.obligationRepository, {
            ...input,
            kind: this.kind,
            clock: this.clock,
        })
        if (current.status === 'CANCELED') {
            throw new ConflictError('Conta ja esta cancelada')
        }
        const updated = await this.repository.changeTransactionStatus({
            id: current.id,
            organizationId: current.organizationId,
            status: 'CANCELED',
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
