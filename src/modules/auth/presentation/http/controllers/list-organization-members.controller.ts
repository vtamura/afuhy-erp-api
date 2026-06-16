import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listOrganizationMembersSchema } from '../../../application/contracts'
import type { OrganizationMemberResponseDto } from '../../../application/dto'
import type { ListOrganizationMembersUseCase } from '../../../application/use-cases'

export class ListOrganizationMembersController extends BaseController<
    typeof listOrganizationMembersSchema,
    OrganizationMemberResponseDto[]
> {
    protected readonly schema = listOrganizationMembersSchema

    constructor(
        private readonly listOrganizationMembersUseCase: ListOrganizationMembersUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listOrganizationMembersSchema>,
    ): Promise<OrganizationMemberResponseDto[]> {
        return this.listOrganizationMembersUseCase.execute({
            organizationId: input.id,
            userId: input.authUser.userId,
        })
    }
}
