import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createTaskSchema } from '../../../application/contracts'
import type { TaskResponseDto } from '../../../application/dto'
import type { CreateTaskUseCase } from '../../../application/use-cases'

export class CreateTaskController extends BaseController<
    typeof createTaskSchema,
    TaskResponseDto
> {
    protected readonly schema = createTaskSchema

    constructor(private readonly useCase: CreateTaskUseCase) {
        super()
    }

    protected async execute(input: ControllerInput<typeof createTaskSchema>) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                title: input.title,
                description: input.description,
                status: input.status,
                priority: input.priority,
                assigneeOrganizationUserId: input.assigneeOrganizationUserId,
                createdBy: input.authUser.userId,
                dueAt: input.dueAt ? new Date(input.dueAt) : null,
            }),
        }
    }
}
