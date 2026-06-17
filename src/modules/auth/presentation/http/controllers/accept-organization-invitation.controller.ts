import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { acceptOrganizationInvitationSchema } from '../../../application/contracts'
import type { AcceptOrganizationInvitationUseCase } from '../../../application/use-cases'

export class AcceptOrganizationInvitationController extends BaseController<
    typeof acceptOrganizationInvitationSchema,
    void
> {
    protected readonly schema = acceptOrganizationInvitationSchema

    constructor(
        private readonly acceptOrganizationInvitationUseCase: AcceptOrganizationInvitationUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof acceptOrganizationInvitationSchema>,
    ): Promise<void> {
        return this.acceptOrganizationInvitationUseCase.execute({
            token: input.token,
            name: input.name,
            password: input.password,
        })
    }
}
