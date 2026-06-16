import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import { removeOrganizationMemberSchema } from '../../../application/contracts'
import type { RemoveOrganizationMemberUseCase } from '../../../application/use-cases'

export class RemoveOrganizationMemberController extends BaseController<
    typeof removeOrganizationMemberSchema,
    void
> {
    protected readonly schema = removeOrganizationMemberSchema

    constructor(
        private readonly removeOrganizationMemberUseCase: RemoveOrganizationMemberUseCase,
    ) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof removeOrganizationMemberSchema>,
    ) {
        if (!input.authUser.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        await this.removeOrganizationMemberUseCase.execute({
            organizationId: input.id,
            organizationUserId: input.organizationUserId,
        })

        return {
            statusCode: 204,
        }
    }
}
