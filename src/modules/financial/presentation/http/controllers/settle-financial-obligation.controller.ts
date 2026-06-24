import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { settleFinancialObligationSchema } from '../../../application/contracts'
import type { FinancialObligationResponseDto } from '../../../application/dto'
import type { SettleFinancialObligationUseCase } from '../../../application/use-cases'

export class SettleFinancialObligationController extends BaseController<
    typeof settleFinancialObligationSchema,
    FinancialObligationResponseDto
> {
    protected readonly schema = settleFinancialObligationSchema

    constructor(private readonly useCase: SettleFinancialObligationUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof settleFinancialObligationSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            settlementDate: input.settlementDate,
            accountId: input.accountId,
        })
    }
}
