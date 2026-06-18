import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getFinancialDashboardSchema } from '../../../application/contracts'
import type { FinancialDashboardResponseDto } from '../../../application/dto'
import type { GetFinancialDashboardUseCase } from '../../../application/use-cases'

export class GetFinancialDashboardController extends BaseController<
    typeof getFinancialDashboardSchema,
    FinancialDashboardResponseDto
> {
    protected readonly schema = getFinancialDashboardSchema

    constructor(private readonly useCase: GetFinancialDashboardUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof getFinancialDashboardSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
            year: input.year,
            month: input.month,
        })
    }
}
