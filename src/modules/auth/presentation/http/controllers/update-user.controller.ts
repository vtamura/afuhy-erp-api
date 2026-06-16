import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import { updateUserSchema } from '../../../application/contracts'
import type { UserResponseDto } from '../../../application/dto'
import type { UpdateUserUseCase } from '../../../application/use-cases'

export class UpdateUserController extends BaseController<
    typeof updateUserSchema,
    UserResponseDto
> {
    protected readonly schema = updateUserSchema

    constructor(private readonly updateUserUseCase: UpdateUserUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof updateUserSchema>,
    ): Promise<UserResponseDto> {
        if (!input.authUser.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        return this.updateUserUseCase.execute({
            id: input.id,
            name: input.name,
            email: input.email,
            status: input.status,
            organizationId: input.authUser.organizationId,
        })
    }
}
