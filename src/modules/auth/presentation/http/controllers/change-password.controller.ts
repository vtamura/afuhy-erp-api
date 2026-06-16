import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { changePasswordSchema } from '../../../application/contracts'
import type { ChangePasswordUseCase } from '../../../application/use-cases'

export class ChangePasswordController extends BaseController<
    typeof changePasswordSchema,
    void
> {
    protected readonly schema = changePasswordSchema

    constructor(private readonly changePasswordUseCase: ChangePasswordUseCase) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof changePasswordSchema>,
    ) {
        await this.changePasswordUseCase.execute({
            userId: input.authUser.userId,
            currentSessionId: input.authUser.sessionId,
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
        })

        return {
            statusCode: 204,
        }
    }
}
