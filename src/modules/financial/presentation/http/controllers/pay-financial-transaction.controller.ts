import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { payFinancialTransactionSchema } from '../../../application/contracts'
import type { FinancialTransactionResponseDto } from '../../../application/dto'
import type { PayFinancialTransactionUseCase } from '../../../application/use-cases'

export class PayFinancialTransactionController extends BaseController<
    typeof payFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = payFinancialTransactionSchema
    constructor(private readonly useCase: PayFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof payFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            settlementDate: input.settlementDate,
            accountId: input.accountId,
        })
    }
}
