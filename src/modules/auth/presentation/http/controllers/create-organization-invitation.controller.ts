import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createOrganizationInvitationSchema } from '../../../application/contracts'
import type { OrganizationInvitationResponseDto } from '../../../application/dto'
import type { CreateOrganizationInvitationUseCase } from '../../../application/use-cases'

export class CreateOrganizationInvitationController extends BaseController<
    typeof createOrganizationInvitationSchema,
    OrganizationInvitationResponseDto
> {
    protected readonly schema = createOrganizationInvitationSchema

    constructor(
        private readonly createOrganizationInvitationUseCase: CreateOrganizationInvitationUseCase,
    ) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof createOrganizationInvitationSchema>,
    ) {
        const invitation =
            await this.createOrganizationInvitationUseCase.execute({
                organizationId: input.id,
                invitedByUserId: input.authUser.userId,
                email: input.email,
                roleCodes: input.roleCodes,
            })

        return {
            statusCode: 201,
            body: invitation,
        }
    }
}
