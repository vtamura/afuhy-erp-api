import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getFinancialCategorySchema } from '../../../application/contracts'
import type { FinancialCategoryResponseDto } from '../../../application/dto'
import type { GetFinancialCategoryUseCase } from '../../../application/use-cases'

export class GetFinancialCategoryController extends BaseController<
    typeof getFinancialCategorySchema,
    FinancialCategoryResponseDto
> {
    protected readonly schema = getFinancialCategorySchema
    constructor(private readonly useCase: GetFinancialCategoryUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getFinancialCategorySchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
