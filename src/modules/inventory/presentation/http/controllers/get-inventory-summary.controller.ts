import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getInventorySummarySchema } from '../../../application/contracts'
import type { InventorySummaryResponseDto } from '../../../application/dto'
import type { GetInventorySummaryUseCase } from '../../../application/use-cases'

export class GetInventorySummaryController extends BaseController<
    typeof getInventorySummarySchema,
    InventorySummaryResponseDto
> {
    protected readonly schema = getInventorySummarySchema
    constructor(private readonly useCase: GetInventorySummaryUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getInventorySummarySchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
