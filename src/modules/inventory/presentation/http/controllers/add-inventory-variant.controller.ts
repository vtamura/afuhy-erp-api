import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { addInventoryVariantSchema } from '../../../application/contracts'
import type { InventoryVariantResponseDto } from '../../../application/dto'
import type { AddInventoryVariantUseCase } from '../../../application/use-cases'

export class AddInventoryVariantController extends BaseController<
    typeof addInventoryVariantSchema,
    InventoryVariantResponseDto
> {
    protected readonly schema = addInventoryVariantSchema
    constructor(private readonly useCase: AddInventoryVariantUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof addInventoryVariantSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                id: input.id,
                organizationId: input.authUser.organizationId ?? null,
                name: input.name,
                sku: input.sku,
                barcode: input.barcode,
                salePrice: input.salePrice,
                minimumQuantity: input.minimumQuantity,
                status: input.status,
            }),
        }
    }
}
