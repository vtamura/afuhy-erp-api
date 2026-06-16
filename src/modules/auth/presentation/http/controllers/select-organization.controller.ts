import { env } from '../../../../../shared/config/env'
import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { selectOrganizationSchema } from '../../../application/contracts'
import type { AuthResponseDto } from '../../../application/dto'
import type { SelectOrganizationUseCase } from '../../../application/use-cases'
import { createAuthCookies, REFRESH_TOKEN_COOKIE_NAME } from '../auth-cookies'

export class SelectOrganizationController extends BaseController<
    typeof selectOrganizationSchema,
    AuthResponseDto
> {
    protected readonly schema = selectOrganizationSchema

    constructor(
        private readonly selectOrganizationUseCase: SelectOrganizationUseCase,
    ) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof selectOrganizationSchema>,
    ) {
        const result = await this.selectOrganizationUseCase.execute({
            organizationId: input.organizationId,
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
