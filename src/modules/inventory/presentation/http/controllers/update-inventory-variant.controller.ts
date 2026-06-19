import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { updateInventoryVariantSchema } from '../../../application/contracts'
import type { InventoryVariantResponseDto } from '../../../application/dto'
import type { UpdateInventoryVariantUseCase } from '../../../application/use-cases'

export class UpdateInventoryVariantController extends BaseController<
    typeof updateInventoryVariantSchema,
    InventoryVariantResponseDto
> {
    protected readonly schema = updateInventoryVariantSchema
    constructor(private readonly useCase: UpdateInventoryVariantUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof updateInventoryVariantSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            variantId: input.variantId,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            sku: input.sku,
            barcode: input.barcode,
            salePrice: input.salePrice,
            minimumQuantity: input.minimumQuantity,
            status: input.status,
        })
    }
}
