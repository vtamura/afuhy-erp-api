import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { resetPasswordSchema } from '../../../application/contracts'
import type { ResetPasswordUseCase } from '../../../application/use-cases'

export class ResetPasswordController extends BaseController<
    typeof resetPasswordSchema,
    void
> {
    protected readonly schema = resetPasswordSchema

    constructor(private readonly resetPasswordUseCase: ResetPasswordUseCase) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof resetPasswordSchema>,
    ) {
        await this.resetPasswordUseCase.execute({
            token: input.token,
            newPassword: input.newPassword,
        })

        return {
            statusCode: 204,
        }
    }
}
