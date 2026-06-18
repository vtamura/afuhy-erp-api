import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listFinancialTransactionsSchema } from '../../../application/contracts'
import type { FinancialTransactionListResponseDto } from '../../../application/dto'
import type { ListFinancialTransactionsUseCase } from '../../../application/use-cases'

export class ListFinancialTransactionsController extends BaseController<
    typeof listFinancialTransactionsSchema,
    FinancialTransactionListResponseDto
> {
    protected readonly schema = listFinancialTransactionsSchema
    constructor(private readonly useCase: ListFinancialTransactionsUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listFinancialTransactionsSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
            accountId: input.accountId,
            categoryId: input.categoryId,
            customerId: input.customerId,
            supplierId: input.supplierId,
            type: input.type,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            page: input.page,
            pageSize: input.pageSize,
        })
    }
}
