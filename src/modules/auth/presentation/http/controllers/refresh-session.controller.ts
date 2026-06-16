import { env } from '../../../../../shared/config/env'
import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { refreshSessionSchema } from '../../../application/contracts'
import type { AuthResponseDto } from '../../../application/dto'
import type { RefreshSessionUseCase } from '../../../application/use-cases'
import { createAuthCookies, REFRESH_TOKEN_COOKIE_NAME } from '../auth-cookies'

export class RefreshSessionController extends BaseController<
    typeof refreshSessionSchema,
    AuthResponseDto
> {
    protected readonly schema = refreshSessionSchema

    constructor(private readonly refreshSessionUseCase: RefreshSessionUseCase) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof refreshSessionSchema>,
    ) {
        const result = await this.refreshSessionUseCase.execute({
            refreshToken: input.cookies?.[REFRESH_TOKEN_COOKIE_NAME],
        })
        const { tokens, ...body } = result

        return {
            statusCode: 200,
            body: env.NODE_ENV === 'development' ? result : body,
            cookies: createAuthCookies(tokens),
        }
    }
}
