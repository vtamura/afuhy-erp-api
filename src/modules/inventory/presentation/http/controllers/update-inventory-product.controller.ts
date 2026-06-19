import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { updateInventoryProductSchema } from '../../../application/contracts'
import type { InventoryProductResponseDto } from '../../../application/dto'
import type { UpdateInventoryProductUseCase } from '../../../application/use-cases'

export class UpdateInventoryProductController extends BaseController<
    typeof updateInventoryProductSchema,
    InventoryProductResponseDto
> {
    protected readonly schema = updateInventoryProductSchema
    constructor(private readonly useCase: UpdateInventoryProductUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof updateInventoryProductSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            description: input.description,
            unit: input.unit,
            status: input.status,
        })
    }
}
