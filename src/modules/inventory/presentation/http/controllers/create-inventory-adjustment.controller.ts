import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createInventoryAdjustmentSchema } from '../../../application/contracts'
import type { InventoryMovementResponseDto } from '../../../application/dto'
import type { CreateInventoryAdjustmentUseCase } from '../../../application/use-cases'

export class CreateInventoryAdjustmentController extends BaseController<
    typeof createInventoryAdjustmentSchema,
    InventoryMovementResponseDto
> {
    protected readonly schema = createInventoryAdjustmentSchema
    constructor(private readonly useCase: CreateInventoryAdjustmentUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createInventoryAdjustmentSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                variantId: input.variantId,
                countedQuantity: input.countedQuantity,
                unitCost: input.unitCost ?? null,
                reason: input.reason,
                notes: input.notes,
                movementDate: new Date(input.movementDate),
                createdBy: input.authUser.userId,
            }),
        }
    }
}
