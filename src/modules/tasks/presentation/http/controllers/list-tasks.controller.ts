import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listTasksSchema } from '../../../application/contracts'
import type { TaskListResponseDto } from '../../../application/dto'
import type { ListTasksUseCase } from '../../../application/use-cases'

export class ListTasksController extends BaseController<
    typeof listTasksSchema,
    TaskListResponseDto
> {
    protected readonly schema = listTasksSchema

    constructor(private readonly useCase: ListTasksUseCase) {
        super()
    }

    protected execute(input: ControllerInput<typeof listTasksSchema>) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
            status: input.status,
            priority: input.priority,
            assigneeOrganizationUserId: input.assigneeOrganizationUserId,
            dueFrom: input.dueFrom ? new Date(input.dueFrom) : undefined,
            dueTo: input.dueTo ? new Date(input.dueTo) : undefined,
            overdue: input.overdue,
            search: input.search,
            page: input.page,
            pageSize: input.pageSize,
        })
    }
}
