import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getCurrentAuthContextSchema } from '../../../application/contracts'
import type { AuthResponseDto } from '../../../application/dto'
import type { GetCurrentAuthContextUseCase } from '../../../application/use-cases'

export class GetCurrentAuthContextController extends BaseController<
    typeof getCurrentAuthContextSchema,
    AuthResponseDto
> {
    protected readonly schema = getCurrentAuthContextSchema

    constructor(
        private readonly getCurrentAuthContextUseCase: GetCurrentAuthContextUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof getCurrentAuthContextSchema>,
    ) {
        return this.getCurrentAuthContextUseCase.execute({
            userId: input.authUser.userId,
            sessionId: input.authUser.sessionId,
        })
    }
}
