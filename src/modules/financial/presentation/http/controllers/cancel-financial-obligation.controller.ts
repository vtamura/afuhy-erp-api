import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { cancelFinancialObligationSchema } from '../../../application/contracts'
import type { FinancialObligationResponseDto } from '../../../application/dto'
import type { CancelFinancialObligationUseCase } from '../../../application/use-cases'

export class CancelFinancialObligationController extends BaseController<
    typeof cancelFinancialObligationSchema,
    FinancialObligationResponseDto
> {
    protected readonly schema = cancelFinancialObligationSchema

    constructor(private readonly useCase: CancelFinancialObligationUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof cancelFinancialObligationSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
