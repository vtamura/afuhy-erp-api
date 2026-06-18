import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { deleteFinancialObligationSchema } from '../../../application/contracts'
import type { DeleteFinancialObligationUseCase } from '../../../application/use-cases'

export class DeleteFinancialObligationController extends BaseController<
    typeof deleteFinancialObligationSchema
> {
    protected readonly schema = deleteFinancialObligationSchema

    constructor(private readonly useCase: DeleteFinancialObligationUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof deleteFinancialObligationSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
