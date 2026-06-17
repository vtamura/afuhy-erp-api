import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getCurrentSubscriptionSchema } from '../../../application/contracts'
import type { SubscriptionResponseDto } from '../../../application/dto'
import type { GetCurrentSubscriptionUseCase } from '../../../application/use-cases'

export class GetCurrentSubscriptionController extends BaseController<
    typeof getCurrentSubscriptionSchema,
    SubscriptionResponseDto
> {
    protected readonly schema = getCurrentSubscriptionSchema

    constructor(
        private readonly getCurrentSubscriptionUseCase: GetCurrentSubscriptionUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof getCurrentSubscriptionSchema>,
    ): Promise<SubscriptionResponseDto> {
        return this.getCurrentSubscriptionUseCase.execute({
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
