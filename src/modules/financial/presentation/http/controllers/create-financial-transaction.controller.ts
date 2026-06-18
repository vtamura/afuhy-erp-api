import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createFinancialTransactionSchema } from '../../../application/contracts'
import type { FinancialTransactionResponseDto } from '../../../application/dto'
import type { CreateFinancialTransactionUseCase } from '../../../application/use-cases'

export class CreateFinancialTransactionController extends BaseController<
    typeof createFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = createFinancialTransactionSchema
    constructor(private readonly useCase: CreateFinancialTransactionUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createFinancialTransactionSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
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
            }),
        }
    }
}
