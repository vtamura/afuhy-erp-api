import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { revokeOtherSessionsSchema } from '../../../application/contracts'
import type { RevokeOtherSessionsUseCase } from '../../../application/use-cases'

export class RevokeOtherSessionsController extends BaseController<
    typeof revokeOtherSessionsSchema,
    void
> {
    protected readonly schema = revokeOtherSessionsSchema

    constructor(
        private readonly revokeOtherSessionsUseCase: RevokeOtherSessionsUseCase,
    ) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof revokeOtherSessionsSchema>,
    ) {
        await this.revokeOtherSessionsUseCase.execute({
            userId: input.authUser.userId,
            currentSessionId: input.authUser.sessionId,
        })

        return {
            statusCode: 204,
        }
    }
}
