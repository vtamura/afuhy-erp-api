import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listOrganizationsSchema } from '../../../application/contracts'
import type { OrganizationResponseDto } from '../../../application/dto'
import type { ListOrganizationsUseCase } from '../../../application/use-cases'

export class ListOrganizationsController extends BaseController<
    typeof listOrganizationsSchema,
    OrganizationResponseDto[]
> {
    protected readonly schema = listOrganizationsSchema

    constructor(
        private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listOrganizationsSchema>,
    ): Promise<OrganizationResponseDto[]> {
        return this.listOrganizationsUseCase.execute(input.authUser.userId)
    }
}
