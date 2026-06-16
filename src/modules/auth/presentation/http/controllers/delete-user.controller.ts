import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import { deleteUserSchema } from '../../../application/contracts'
import type { DeleteUserUseCase } from '../../../application/use-cases'

export class DeleteUserController extends BaseController<
    typeof deleteUserSchema,
    void
> {
    protected readonly schema = deleteUserSchema

    constructor(private readonly deleteUserUseCase: DeleteUserUseCase) {
        super()
    }

    protected async execute(input: ControllerInput<typeof deleteUserSchema>) {
        if (!input.authUser.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        await this.deleteUserUseCase.execute({
            id: input.id,
            authenticatedUserId: input.authUser.userId,
            organizationId: input.authUser.organizationId,
        })

        return {
            statusCode: 204,
        }
    }
}
