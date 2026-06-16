import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import { updateMemberRolesSchema } from '../../../application/contracts'
import type { OrganizationMemberResponseDto } from '../../../application/dto'
import type { UpdateMemberRolesUseCase } from '../../../application/use-cases'

export class UpdateMemberRolesController extends BaseController<
    typeof updateMemberRolesSchema,
    OrganizationMemberResponseDto
> {
    protected readonly schema = updateMemberRolesSchema

    constructor(
        private readonly updateMemberRolesUseCase: UpdateMemberRolesUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof updateMemberRolesSchema>,
    ): Promise<OrganizationMemberResponseDto> {
        if (!input.authUser.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        return this.updateMemberRolesUseCase.execute({
            organizationId: input.id,
            organizationUserId: input.organizationUserId,
            roleCodes: input.roleCodes,
        })
    }
}
