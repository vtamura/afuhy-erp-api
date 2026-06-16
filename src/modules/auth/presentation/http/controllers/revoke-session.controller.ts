import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { revokeSessionSchema } from '../../../application/contracts'
import type { RevokeSessionUseCase } from '../../../application/use-cases'

export class RevokeSessionController extends BaseController<
    typeof revokeSessionSchema,
    void
> {
    protected readonly schema = revokeSessionSchema

    constructor(private readonly revokeSessionUseCase: RevokeSessionUseCase) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof revokeSessionSchema>,
    ) {
        await this.revokeSessionUseCase.execute({
            userId: input.authUser.userId,
            sessionId: input.id,
        })

        return {
            statusCode: 204,
        }
    }
}
