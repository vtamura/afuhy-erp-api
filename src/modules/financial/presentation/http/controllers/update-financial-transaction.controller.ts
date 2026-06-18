import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { updateFinancialTransactionSchema } from '../../../application/contracts'
import type { FinancialTransactionResponseDto } from '../../../application/dto'
import type { UpdateFinancialTransactionUseCase } from '../../../application/use-cases'

export class UpdateFinancialTransactionController extends BaseController<
    typeof updateFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = updateFinancialTransactionSchema
    constructor(private readonly useCase: UpdateFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof updateFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            accountId: input.accountId,
            categoryId: input.categoryId,
            customerId: input.customerId,
            supplierId: input.supplierId,
            description: input.description,
            notes: input.notes,
            type: input.type,
            amount: input.amount,
            transactionDate: input.transactionDate,
            dueDate: input.dueDate,
        })
    }
}
