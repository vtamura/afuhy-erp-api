import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getInventoryProductSchema } from '../../../application/contracts'
import type { InventoryProductResponseDto } from '../../../application/dto'
import type { GetInventoryProductUseCase } from '../../../application/use-cases'

export class GetInventoryProductController extends BaseController<
    typeof getInventoryProductSchema,
    InventoryProductResponseDto
> {
    protected readonly schema = getInventoryProductSchema
    constructor(private readonly useCase: GetInventoryProductUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getInventoryProductSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
