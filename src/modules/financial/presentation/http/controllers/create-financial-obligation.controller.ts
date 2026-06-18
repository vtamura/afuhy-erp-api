import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createFinancialObligationSchema } from '../../../application/contracts'
import type { FinancialObligationResponseDto } from '../../../application/dto'
import type { CreateFinancialObligationUseCase } from '../../../application/use-cases'

export class CreateFinancialObligationController extends BaseController<
    typeof createFinancialObligationSchema,
    FinancialObligationResponseDto
> {
    protected readonly schema = createFinancialObligationSchema

    constructor(private readonly useCase: CreateFinancialObligationUseCase) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof createFinancialObligationSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
                accountId: input.accountId,
                categoryId: input.categoryId,
                counterpartyId: input.counterpartyId,
                description: input.description,
                notes: input.notes,
                amount: input.amount,
                transactionDate: input.transactionDate,
                dueDate: input.dueDate,
            }),
        }
    }
}
