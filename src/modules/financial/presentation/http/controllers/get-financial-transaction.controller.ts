import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getFinancialTransactionSchema } from '../../../application/contracts'
import type { FinancialTransactionResponseDto } from '../../../application/dto'
import type { GetFinancialTransactionUseCase } from '../../../application/use-cases'

export class GetFinancialTransactionController extends BaseController<
    typeof getFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = getFinancialTransactionSchema
    constructor(private readonly useCase: GetFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
