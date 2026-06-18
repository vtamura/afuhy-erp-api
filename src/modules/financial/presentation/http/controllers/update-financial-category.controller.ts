import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { updateFinancialCategorySchema } from '../../../application/contracts'
import type { FinancialCategoryResponseDto } from '../../../application/dto'
import type { UpdateFinancialCategoryUseCase } from '../../../application/use-cases'

export class UpdateFinancialCategoryController extends BaseController<
    typeof updateFinancialCategorySchema,
    FinancialCategoryResponseDto
> {
    protected readonly schema = updateFinancialCategorySchema
    constructor(private readonly useCase: UpdateFinancialCategoryUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof updateFinancialCategorySchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            type: input.type,
            status: input.status,
        })
    }
}
