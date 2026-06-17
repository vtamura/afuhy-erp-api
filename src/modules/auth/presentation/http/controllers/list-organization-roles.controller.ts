import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listOrganizationRolesSchema } from '../../../application/contracts'
import type { OrganizationRoleResponseDto } from '../../../application/dto'
import type { ListOrganizationRolesUseCase } from '../../../application/use-cases'

export class ListOrganizationRolesController extends BaseController<
    typeof listOrganizationRolesSchema,
    OrganizationRoleResponseDto[]
> {
    protected readonly schema = listOrganizationRolesSchema

    constructor(
        private readonly listOrganizationRolesUseCase: ListOrganizationRolesUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listOrganizationRolesSchema>,
    ): Promise<OrganizationRoleResponseDto[]> {
        return this.listOrganizationRolesUseCase.execute({
            organizationId: input.id,
        })
    }
}
