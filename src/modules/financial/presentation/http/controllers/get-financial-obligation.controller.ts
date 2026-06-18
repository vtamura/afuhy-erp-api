import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getFinancialObligationSchema } from '../../../application/contracts'
import type { FinancialObligationResponseDto } from '../../../application/dto'
import type { GetFinancialObligationUseCase } from '../../../application/use-cases'

export class GetFinancialObligationController extends BaseController<
    typeof getFinancialObligationSchema,
    FinancialObligationResponseDto
> {
    protected readonly schema = getFinancialObligationSchema

    constructor(private readonly useCase: GetFinancialObligationUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof getFinancialObligationSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
