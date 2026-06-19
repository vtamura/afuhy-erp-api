import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listInventoryMovementsSchema } from '../../../application/contracts'
import type { InventoryMovementListResponseDto } from '../../../application/dto'
import type { ListInventoryMovementsUseCase } from '../../../application/use-cases'

export class ListInventoryMovementsController extends BaseController<
    typeof listInventoryMovementsSchema,
    InventoryMovementListResponseDto
> {
    protected readonly schema = listInventoryMovementsSchema
    constructor(private readonly useCase: ListInventoryMovementsUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listInventoryMovementsSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
            productId: input.productId,
            variantId: input.variantId,
            type: input.type,
            supplierId: input.supplierId,
            startDate: input.startDate ? new Date(input.startDate) : undefined,
            endDate: input.endDate ? new Date(input.endDate) : undefined,
            page: input.page,
            pageSize: input.pageSize,
        })
    }
}
