import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { deleteTaskSchema } from '../../../application/contracts'
import type { DeleteTaskUseCase } from '../../../application/use-cases'

export class DeleteTaskController extends BaseController<
    typeof deleteTaskSchema
> {
    protected readonly schema = deleteTaskSchema

    constructor(private readonly useCase: DeleteTaskUseCase) {
        super()
    }

    protected execute(input: ControllerInput<typeof deleteTaskSchema>) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
