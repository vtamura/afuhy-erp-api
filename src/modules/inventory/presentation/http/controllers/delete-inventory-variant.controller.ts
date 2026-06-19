import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { deleteInventoryVariantSchema } from '../../../application/contracts'
import type { DeleteInventoryVariantUseCase } from '../../../application/use-cases'

export class DeleteInventoryVariantController extends BaseController<
    typeof deleteInventoryVariantSchema
> {
    protected readonly schema = deleteInventoryVariantSchema
    constructor(private readonly useCase: DeleteInventoryVariantUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof deleteInventoryVariantSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            variantId: input.variantId,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
