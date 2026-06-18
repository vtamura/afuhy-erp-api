import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { updateTaskSchema } from '../../../application/contracts'
import type { TaskResponseDto } from '../../../application/dto'
import type { UpdateTaskUseCase } from '../../../application/use-cases'

export class UpdateTaskController extends BaseController<
    typeof updateTaskSchema,
    TaskResponseDto
> {
    protected readonly schema = updateTaskSchema

    constructor(private readonly useCase: UpdateTaskUseCase) {
        super()
    }

    protected execute(input: ControllerInput<typeof updateTaskSchema>) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            title: input.title,
            description: input.description,
            priority: input.priority,
            assigneeOrganizationUserId: input.assigneeOrganizationUserId,
            dueAt:
                input.dueAt === undefined
                    ? undefined
                    : input.dueAt
                      ? new Date(input.dueAt)
                      : null,
        })
    }
}
