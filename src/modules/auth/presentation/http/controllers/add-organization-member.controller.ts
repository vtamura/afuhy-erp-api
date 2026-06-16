import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import { addOrganizationMemberSchema } from '../../../application/contracts'
import type { OrganizationMemberResponseDto } from '../../../application/dto'
import type { AddOrganizationMemberUseCase } from '../../../application/use-cases'

export class AddOrganizationMemberController extends BaseController<
    typeof addOrganizationMemberSchema,
    OrganizationMemberResponseDto
> {
    protected readonly schema = addOrganizationMemberSchema

    constructor(
        private readonly addOrganizationMemberUseCase: AddOrganizationMemberUseCase,
    ) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof addOrganizationMemberSchema>,
    ) {
        if (!input.authUser.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const member = await this.addOrganizationMemberUseCase.execute({
            organizationId: input.id,
            email: input.email,
            roleCodes: input.roleCodes,
        })

        return {
            statusCode: 201,
            body: member,
        }
    }
}
