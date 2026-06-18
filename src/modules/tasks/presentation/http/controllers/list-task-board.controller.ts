import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listTaskBoardSchema } from '../../../application/contracts'
import type { TaskBoardResponseDto } from '../../../application/dto'
import type { ListTaskBoardUseCase } from '../../../application/use-cases'

export class ListTaskBoardController extends BaseController<
    typeof listTaskBoardSchema,
    TaskBoardResponseDto
> {
    protected readonly schema = listTaskBoardSchema

    constructor(private readonly useCase: ListTaskBoardUseCase) {
        super()
    }

    protected execute(input: ControllerInput<typeof listTaskBoardSchema>) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
