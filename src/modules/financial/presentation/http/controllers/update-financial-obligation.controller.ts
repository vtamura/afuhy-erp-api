import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { updateFinancialObligationSchema } from '../../../application/contracts'
import type { FinancialObligationResponseDto } from '../../../application/dto'
import type { UpdateFinancialObligationUseCase } from '../../../application/use-cases'

export class UpdateFinancialObligationController extends BaseController<
    typeof updateFinancialObligationSchema,
    FinancialObligationResponseDto
> {
    protected readonly schema = updateFinancialObligationSchema

    constructor(private readonly useCase: UpdateFinancialObligationUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof updateFinancialObligationSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            accountId: input.accountId,
            categoryId: input.categoryId,
            counterpartyId: input.counterpartyId,
            description: input.description,
            notes: input.notes,
            amount: input.amount,
            transactionDate: input.transactionDate,
            dueDate: input.dueDate,
        })
    }
}
