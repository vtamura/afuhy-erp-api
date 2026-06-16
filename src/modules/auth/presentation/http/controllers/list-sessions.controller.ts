import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listSessionsSchema } from '../../../application/contracts'
import type { ManagedSessionResponseDto } from '../../../application/dto'
import type { ListSessionsUseCase } from '../../../application/use-cases'

export class ListSessionsController extends BaseController<
    typeof listSessionsSchema,
    ManagedSessionResponseDto[]
> {
    protected readonly schema = listSessionsSchema

    constructor(private readonly listSessionsUseCase: ListSessionsUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listSessionsSchema>,
    ): Promise<ManagedSessionResponseDto[]> {
        return this.listSessionsUseCase.execute(input.authUser.userId)
    }
}
