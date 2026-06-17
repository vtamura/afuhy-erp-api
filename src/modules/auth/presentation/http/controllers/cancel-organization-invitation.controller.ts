import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { cancelOrganizationInvitationSchema } from '../../../application/contracts'
import type { CancelOrganizationInvitationUseCase } from '../../../application/use-cases'

export class CancelOrganizationInvitationController extends BaseController<
    typeof cancelOrganizationInvitationSchema,
    void
> {
    protected readonly schema = cancelOrganizationInvitationSchema

    constructor(
        private readonly cancelOrganizationInvitationUseCase: CancelOrganizationInvitationUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof cancelOrganizationInvitationSchema>,
    ): Promise<void> {
        return this.cancelOrganizationInvitationUseCase.execute({
            organizationId: input.id,
            invitationId: input.invitationId,
        })
    }
}
