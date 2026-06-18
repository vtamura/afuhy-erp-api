import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { deleteFinancialTransactionSchema } from '../../../application/contracts'
import type { DeleteFinancialTransactionUseCase } from '../../../application/use-cases'

export class DeleteFinancialTransactionController extends BaseController<
    typeof deleteFinancialTransactionSchema
> {
    protected readonly schema = deleteFinancialTransactionSchema
    constructor(private readonly useCase: DeleteFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof deleteFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
