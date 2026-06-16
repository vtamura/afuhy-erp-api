import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
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
        await this.deleteUserUseCase.execute({
            id: input.id,
            authenticatedUserId: input.authUser.userId,
        })

        return {
            statusCode: 204,
        }
    }
}
