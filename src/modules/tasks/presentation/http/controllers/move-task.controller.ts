import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { moveTaskSchema } from '../../../application/contracts'
import type { TaskResponseDto } from '../../../application/dto'
import type { MoveTaskUseCase } from '../../../application/use-cases'

export class MoveTaskController extends BaseController<
    typeof moveTaskSchema,
    TaskResponseDto
> {
    protected readonly schema = moveTaskSchema

    constructor(private readonly useCase: MoveTaskUseCase) {
        super()
    }

    protected execute(input: ControllerInput<typeof moveTaskSchema>) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            status: input.status,
            position: input.position,
        })
    }
}
