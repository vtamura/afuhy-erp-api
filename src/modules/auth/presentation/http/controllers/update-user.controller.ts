import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
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
        return this.updateUserUseCase.execute(input)
    }
}
