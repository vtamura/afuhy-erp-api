import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getFinancialAccountSchema } from '../../../application/contracts'
import type { FinancialAccountResponseDto } from '../../../application/dto'
import type { GetFinancialAccountUseCase } from '../../../application/use-cases'

export class GetFinancialAccountController extends BaseController<
    typeof getFinancialAccountSchema,
    FinancialAccountResponseDto
> {
    protected readonly schema = getFinancialAccountSchema
    constructor(private readonly useCase: GetFinancialAccountUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getFinancialAccountSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
