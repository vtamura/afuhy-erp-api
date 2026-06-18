import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createFinancialAccountSchema } from '../../../application/contracts'
import type { FinancialAccountResponseDto } from '../../../application/dto'
import type { CreateFinancialAccountUseCase } from '../../../application/use-cases'

export class CreateFinancialAccountController extends BaseController<
    typeof createFinancialAccountSchema,
    FinancialAccountResponseDto
> {
    protected readonly schema = createFinancialAccountSchema
    constructor(private readonly useCase: CreateFinancialAccountUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createFinancialAccountSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                name: input.name,
                type: input.type,
                initialBalance: input.initialBalance,
                status: input.status,
            }),
        }
    }
}
