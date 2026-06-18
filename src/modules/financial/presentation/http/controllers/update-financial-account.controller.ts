import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { updateFinancialAccountSchema } from '../../../application/contracts'
import type { FinancialAccountResponseDto } from '../../../application/dto'
import type { UpdateFinancialAccountUseCase } from '../../../application/use-cases'

export class UpdateFinancialAccountController extends BaseController<
    typeof updateFinancialAccountSchema,
    FinancialAccountResponseDto
> {
    protected readonly schema = updateFinancialAccountSchema
    constructor(private readonly useCase: UpdateFinancialAccountUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof updateFinancialAccountSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            type: input.type,
            initialBalance: input.initialBalance,
            status: input.status,
        })
    }
}
