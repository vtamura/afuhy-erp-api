import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { setOrganizationSubscriptionSchema } from '../../../application/contracts'
import type { SubscriptionResponseDto } from '../../../application/dto'
import type { SetOrganizationSubscriptionUseCase } from '../../../application/use-cases'

export class SetOrganizationSubscriptionController extends BaseController<
    typeof setOrganizationSubscriptionSchema,
    SubscriptionResponseDto
> {
    protected readonly schema = setOrganizationSubscriptionSchema

    constructor(
        private readonly setOrganizationSubscriptionUseCase: SetOrganizationSubscriptionUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof setOrganizationSubscriptionSchema>,
    ): Promise<SubscriptionResponseDto> {
        return this.setOrganizationSubscriptionUseCase.execute({
            organizationId: input.id,
            planCode: input.planCode,
            status: input.status,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            requestId: input.requestId,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
            authUser: input.authUser,
        })
    }
}
