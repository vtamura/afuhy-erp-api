import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createStripeCheckoutSessionSchema } from '../../../application/contracts'
import type { StripeSessionResponseDto } from '../../../application/dto'
import type { CreateStripeCheckoutSessionUseCase } from '../../../application/use-cases'

export class CreateStripeCheckoutSessionController extends BaseController<
    typeof createStripeCheckoutSessionSchema,
    StripeSessionResponseDto
> {
    protected readonly schema = createStripeCheckoutSessionSchema

    constructor(
        private readonly createStripeCheckoutSessionUseCase: CreateStripeCheckoutSessionUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof createStripeCheckoutSessionSchema>,
    ): Promise<StripeSessionResponseDto> {
        return this.createStripeCheckoutSessionUseCase.execute({
            planCode: input.planCode,
            authUser: input.authUser,
            requestId: input.requestId,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        })
    }
}
