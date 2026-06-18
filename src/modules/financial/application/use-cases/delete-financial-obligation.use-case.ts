import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type {
    FinancialObligationKind,
    FinancialObligationRepository,
} from '../../domain/repositories/financial-obligation.repository'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialClock } from '../ports/financial-clock.port'
import {
    findObligationOrThrow,
    obligationNotFoundMessage,
} from './financial-obligation.helpers'

export class DeleteFinancialObligationUseCase {
    constructor(
        private readonly repository: FinancialRepository,
        private readonly obligationRepository: FinancialObligationRepository,
        private readonly clock: FinancialClock,
        private readonly kind: FinancialObligationKind,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<void> {
        const current = await findObligationOrThrow(this.obligationRepository, {
            ...input,
            kind: this.kind,
            clock: this.clock,
        })
        if (current.status === 'PAID') {
            throw new ConflictError(
                'Contas liquidadas devem ser canceladas antes da exclusao',
            )
        }
        const deleted = await this.repository.softDeleteTransaction({
            id: current.id,
            organizationId: current.organizationId,
        })
        if (!deleted) {
            throw new NotFoundError(obligationNotFoundMessage(this.kind))
        }
    }
}
