import type {
    FinancialObligationKind,
    FinancialObligationRepository,
} from '../../domain/repositories/financial-obligation.repository'
import type { FinancialTransactionStatus } from '../../domain/entities/financial.entity'
import type { FinancialClock } from '../ports/financial-clock.port'
import type { FinancialObligationListResponseDto } from '../dto'
import { currentFinancialDate } from '../date/financial-date'
import { toFinancialObligationResponseDto } from '../mappers/financial-response.mapper'
import { requireOrganization } from './financial-use-case.helpers'
import { obligationType } from './financial-obligation.helpers'

export class ListFinancialObligationsUseCase {
    constructor(
        private readonly repository: FinancialObligationRepository,
        private readonly clock: FinancialClock,
        private readonly kind: FinancialObligationKind,
    ) {}

    async execute(input: {
        organizationId: string | null
        status?: FinancialTransactionStatus
        accountId?: string
        categoryId?: string
        counterpartyId?: string
        dueDateStart?: string
        dueDateEnd?: string
        overdue?: boolean
        page: number
        pageSize: number
    }): Promise<FinancialObligationListResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const today = currentFinancialDate(this.clock)
        const result = await this.repository.listObligations(
            {
                organizationId,
                type: obligationType(this.kind),
                status: input.status,
                accountId: input.accountId,
                categoryId: input.categoryId,
                counterpartyId: input.counterpartyId,
                dueDateStart: input.dueDateStart,
                dueDateEnd: input.dueDateEnd,
                overdue: input.overdue,
                today,
            },
            { page: input.page, pageSize: input.pageSize },
        )

        return {
            items: result.items.map((item) =>
                toFinancialObligationResponseDto(item, today),
            ),
            pagination: {
                page: input.page,
                pageSize: input.pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / input.pageSize),
            },
            summary: result.summary,
        }
    }
}
