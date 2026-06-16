import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { forgotPasswordSchema } from '../../../application/contracts'
import type { ForgotPasswordUseCase } from '../../../application/use-cases'

type ForgotPasswordResponse = {
    resetToken?: string
}

export class ForgotPasswordController extends BaseController<
    typeof forgotPasswordSchema,
    ForgotPasswordResponse
> {
    protected readonly schema = forgotPasswordSchema

    constructor(private readonly forgotPasswordUseCase: ForgotPasswordUseCase) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof forgotPasswordSchema>,
    ) {
        const result = await this.forgotPasswordUseCase.execute({
            email: input.email,
        })

        if (!result.resetToken) {
            return {
                statusCode: 204,
            }
        }

        return {
            statusCode: 200,
            body: result,
        }
    }
}
