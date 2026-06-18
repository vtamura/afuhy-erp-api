import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { deleteFinancialAccountSchema } from '../../../application/contracts'
import type { DeleteFinancialAccountUseCase } from '../../../application/use-cases'

export class DeleteFinancialAccountController extends BaseController<
    typeof deleteFinancialAccountSchema
> {
    protected readonly schema = deleteFinancialAccountSchema
    constructor(private readonly useCase: DeleteFinancialAccountUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof deleteFinancialAccountSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
