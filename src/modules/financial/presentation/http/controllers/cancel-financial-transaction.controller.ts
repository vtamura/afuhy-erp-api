import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { cancelFinancialTransactionSchema } from '../../../application/contracts'
import type { FinancialTransactionResponseDto } from '../../../application/dto'
import type { CancelFinancialTransactionUseCase } from '../../../application/use-cases'

export class CancelFinancialTransactionController extends BaseController<
    typeof cancelFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = cancelFinancialTransactionSchema
    constructor(private readonly useCase: CancelFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof cancelFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
