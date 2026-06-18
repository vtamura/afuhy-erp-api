import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { deleteFinancialCategorySchema } from '../../../application/contracts'
import type { DeleteFinancialCategoryUseCase } from '../../../application/use-cases'

export class DeleteFinancialCategoryController extends BaseController<
    typeof deleteFinancialCategorySchema
> {
    protected readonly schema = deleteFinancialCategorySchema
    constructor(private readonly useCase: DeleteFinancialCategoryUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof deleteFinancialCategorySchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
