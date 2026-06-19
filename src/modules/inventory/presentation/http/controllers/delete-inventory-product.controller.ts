import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { deleteInventoryProductSchema } from '../../../application/contracts'
import type { DeleteInventoryProductUseCase } from '../../../application/use-cases'

export class DeleteInventoryProductController extends BaseController<
    typeof deleteInventoryProductSchema
> {
    protected readonly schema = deleteInventoryProductSchema
    constructor(private readonly useCase: DeleteInventoryProductUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof deleteInventoryProductSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
