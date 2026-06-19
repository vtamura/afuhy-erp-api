import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createInventoryMovementSchema } from '../../../application/contracts'
import type { InventoryMovementResponseDto } from '../../../application/dto'
import type { CreateInventoryMovementUseCase } from '../../../application/use-cases'

export class CreateInventoryMovementController extends BaseController<
    typeof createInventoryMovementSchema,
    InventoryMovementResponseDto
> {
    protected readonly schema = createInventoryMovementSchema
    constructor(private readonly useCase: CreateInventoryMovementUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createInventoryMovementSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                variantId: input.variantId,
                type: input.type,
                quantity: input.quantity,
                unitCost: input.unitCost ?? null,
                supplierId: input.supplierId,
                reason: input.reason,
                notes: input.notes,
                movementDate: new Date(input.movementDate),
                createdBy: input.authUser.userId,
            }),
        }
    }
}
