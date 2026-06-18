import type {
    FinancialObligationKind,
    FinancialObligationRepository,
} from '../../domain/repositories/financial-obligation.repository'
import type { FinancialClock } from '../ports/financial-clock.port'
import type { FinancialObligationResponseDto } from '../dto'
import { currentFinancialDate } from '../date/financial-date'
import { toFinancialObligationResponseDto } from '../mappers/financial-response.mapper'
import { findObligationOrThrow } from './financial-obligation.helpers'

export class GetFinancialObligationUseCase {
    constructor(
        private readonly repository: FinancialObligationRepository,
        private readonly clock: FinancialClock,
        private readonly kind: FinancialObligationKind,
    ) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialObligationResponseDto> {
        const obligation = await findObligationOrThrow(this.repository, {
            ...input,
            kind: this.kind,
            clock: this.clock,
        })
        return toFinancialObligationResponseDto(
            obligation,
            currentFinancialDate(this.clock),
        )
    }
}
