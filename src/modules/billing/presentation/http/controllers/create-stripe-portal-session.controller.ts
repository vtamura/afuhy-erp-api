import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createStripePortalSessionSchema } from '../../../application/contracts'
import type { StripeSessionResponseDto } from '../../../application/dto'
import type { CreateStripePortalSessionUseCase } from '../../../application/use-cases'

export class CreateStripePortalSessionController extends BaseController<
    typeof createStripePortalSessionSchema,
    StripeSessionResponseDto
> {
    protected readonly schema = createStripePortalSessionSchema

    constructor(
        private readonly createStripePortalSessionUseCase: CreateStripePortalSessionUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof createStripePortalSessionSchema>,
    ): Promise<StripeSessionResponseDto> {
        return this.createStripePortalSessionUseCase.execute({
            authUser: input.authUser,
            requestId: input.requestId,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        })
    }
}
