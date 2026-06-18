import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listFinancialAccountsSchema } from '../../../application/contracts'
import type { FinancialAccountResponseDto } from '../../../application/dto'
import type { ListFinancialAccountsUseCase } from '../../../application/use-cases'

export class ListFinancialAccountsController extends BaseController<
    typeof listFinancialAccountsSchema,
    FinancialAccountResponseDto[]
> {
    protected readonly schema = listFinancialAccountsSchema
    constructor(private readonly useCase: ListFinancialAccountsUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listFinancialAccountsSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
