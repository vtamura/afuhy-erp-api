import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listOrganizationInvitationsSchema } from '../../../application/contracts'
import type { OrganizationInvitationResponseDto } from '../../../application/dto'
import type { ListOrganizationInvitationsUseCase } from '../../../application/use-cases'

export class ListOrganizationInvitationsController extends BaseController<
    typeof listOrganizationInvitationsSchema,
    OrganizationInvitationResponseDto[]
> {
    protected readonly schema = listOrganizationInvitationsSchema

    constructor(
        private readonly listOrganizationInvitationsUseCase: ListOrganizationInvitationsUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listOrganizationInvitationsSchema>,
    ): Promise<OrganizationInvitationResponseDto[]> {
        return this.listOrganizationInvitationsUseCase.execute({
            organizationId: input.id,
        })
    }
}
