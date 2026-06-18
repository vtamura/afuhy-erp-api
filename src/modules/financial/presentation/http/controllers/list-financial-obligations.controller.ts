import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listFinancialObligationsSchema } from '../../../application/contracts'
import type { FinancialObligationListResponseDto } from '../../../application/dto'
import type { ListFinancialObligationsUseCase } from '../../../application/use-cases'

export class ListFinancialObligationsController extends BaseController<
    typeof listFinancialObligationsSchema,
    FinancialObligationListResponseDto
> {
    protected readonly schema = listFinancialObligationsSchema

    constructor(private readonly useCase: ListFinancialObligationsUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listFinancialObligationsSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
            status: input.status,
            accountId: input.accountId,
            categoryId: input.categoryId,
            counterpartyId: input.counterpartyId,
            dueDateStart: input.dueDateStart,
            dueDateEnd: input.dueDateEnd,
            overdue: input.overdue,
            page: input.page,
            pageSize: input.pageSize,
        })
    }
}
