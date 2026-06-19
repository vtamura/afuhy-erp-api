import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getInventoryMovementSchema } from '../../../application/contracts'
import type { InventoryMovementResponseDto } from '../../../application/dto'
import type { GetInventoryMovementUseCase } from '../../../application/use-cases'

export class GetInventoryMovementController extends BaseController<
    typeof getInventoryMovementSchema,
    InventoryMovementResponseDto
> {
    protected readonly schema = getInventoryMovementSchema
    constructor(private readonly useCase: GetInventoryMovementUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getInventoryMovementSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
