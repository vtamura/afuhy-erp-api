import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { logoutSchema } from '../../../application/contracts'
import type { LogoutUseCase } from '../../../application/use-cases'
import {
    createClearAuthCookies,
    REFRESH_TOKEN_COOKIE_NAME,
} from '../auth-cookies'

export class LogoutController extends BaseController<
    typeof logoutSchema,
    void
> {
    protected readonly schema = logoutSchema

    constructor(private readonly logoutUseCase: LogoutUseCase) {
        super()
    }

    protected async execute(input: ControllerInput<typeof logoutSchema>) {
        await this.logoutUseCase.execute({
            refreshToken: input.cookies?.[REFRESH_TOKEN_COOKIE_NAME],
        })

        return {
            statusCode: 204,
            clearCookies: createClearAuthCookies(),
        }
    }
}
