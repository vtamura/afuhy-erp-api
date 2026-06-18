import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createTaskCommentSchema } from '../../../application/contracts'
import type { TaskCommentResponseDto } from '../../../application/dto'
import type { CreateTaskCommentUseCase } from '../../../application/use-cases'

export class CreateTaskCommentController extends BaseController<
    typeof createTaskCommentSchema,
    TaskCommentResponseDto
> {
    protected readonly schema = createTaskCommentSchema

    constructor(private readonly useCase: CreateTaskCommentUseCase) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof createTaskCommentSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                id: input.id,
                organizationId: input.authUser.organizationId ?? null,
                authorUserId: input.authUser.userId,
                content: input.content,
            }),
        }
    }
}
