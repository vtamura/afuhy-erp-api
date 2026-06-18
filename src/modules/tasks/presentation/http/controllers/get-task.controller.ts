import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getTaskSchema } from '../../../application/contracts'
import type { TaskResponseDto } from '../../../application/dto'
import type { GetTaskUseCase } from '../../../application/use-cases'

export class GetTaskController extends BaseController<
    typeof getTaskSchema,
    TaskResponseDto
> {
    protected readonly schema = getTaskSchema

    constructor(private readonly useCase: GetTaskUseCase) {
        super()
    }

    protected execute(input: ControllerInput<typeof getTaskSchema>) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
