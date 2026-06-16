import { env } from '../../../../../shared/config/env'
import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { loginSchema } from '../../../application/contracts'
import type { AuthResponseDto } from '../../../application/dto'
import type { LoginUseCase } from '../../../application/use-cases'
import { createAuthCookies } from '../auth-cookies'

export class LoginController extends BaseController<
    typeof loginSchema,
    AuthResponseDto
> {
    protected readonly schema = loginSchema

    constructor(private readonly loginUseCase: LoginUseCase) {
        super()
    }

    protected async execute(input: ControllerInput<typeof loginSchema>) {
        const result = await this.loginUseCase.execute({
            email: input.email,
            password: input.password,
            userAgent: getHeaderValue(input.headers?.['user-agent']),
            ipAddress: getHeaderValue(input.headers?.['x-forwarded-for']),
        })
        const { tokens, ...body } = result

        return {
            statusCode: 200,
            body: env.NODE_ENV === 'development' ? result : body,
            cookies: createAuthCookies(tokens),
        }
    }
}

function getHeaderValue(value?: string | string[]): string | undefined {
    if (Array.isArray(value)) {
        return value[0]
    }

    return value
}
