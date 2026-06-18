import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listTaskCommentsSchema } from '../../../application/contracts'
import type { TaskCommentResponseDto } from '../../../application/dto'
import type { ListTaskCommentsUseCase } from '../../../application/use-cases'

export class ListTaskCommentsController extends BaseController<
    typeof listTaskCommentsSchema,
    TaskCommentResponseDto[]
> {
    protected readonly schema = listTaskCommentsSchema

    constructor(private readonly useCase: ListTaskCommentsUseCase) {
        super()
    }

    protected execute(input: ControllerInput<typeof listTaskCommentsSchema>) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
