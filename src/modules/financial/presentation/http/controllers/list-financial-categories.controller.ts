import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listFinancialCategoriesSchema } from '../../../application/contracts'
import type { FinancialCategoryResponseDto } from '../../../application/dto'
import type { ListFinancialCategoriesUseCase } from '../../../application/use-cases'

export class ListFinancialCategoriesController extends BaseController<
    typeof listFinancialCategoriesSchema,
    FinancialCategoryResponseDto[]
> {
    protected readonly schema = listFinancialCategoriesSchema
    constructor(private readonly useCase: ListFinancialCategoriesUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listFinancialCategoriesSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
