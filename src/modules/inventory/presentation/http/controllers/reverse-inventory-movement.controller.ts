import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { reverseInventoryMovementSchema } from '../../../application/contracts'
import type { InventoryMovementResponseDto } from '../../../application/dto'
import type { ReverseInventoryMovementUseCase } from '../../../application/use-cases'

export class ReverseInventoryMovementController extends BaseController<
    typeof reverseInventoryMovementSchema,
    InventoryMovementResponseDto
> {
    protected readonly schema = reverseInventoryMovementSchema
    constructor(private readonly useCase: ReverseInventoryMovementUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof reverseInventoryMovementSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                id: input.id,
                organizationId: input.authUser.organizationId ?? null,
                reason: input.reason,
                movementDate: new Date(input.movementDate),
                createdBy: input.authUser.userId,
            }),
        }
    }
}
