import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createFinancialCategorySchema } from '../../../application/contracts'
import type { FinancialCategoryResponseDto } from '../../../application/dto'
import type { CreateFinancialCategoryUseCase } from '../../../application/use-cases'

export class CreateFinancialCategoryController extends BaseController<
    typeof createFinancialCategorySchema,
    FinancialCategoryResponseDto
> {
    protected readonly schema = createFinancialCategorySchema
    constructor(private readonly useCase: CreateFinancialCategoryUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createFinancialCategorySchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                name: input.name,
                type: input.type,
                status: input.status,
            }),
        }
    }
}
