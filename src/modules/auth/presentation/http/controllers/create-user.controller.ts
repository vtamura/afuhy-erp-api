import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createUserSchema } from '../../../application/contracts'
import type { UserResponseDto } from '../../../application/dto'
import type { CreateUserUseCase } from '../../../application/use-cases'

export class CreateUserController extends BaseController<
    typeof createUserSchema,
    UserResponseDto
> {
    protected readonly schema = createUserSchema

    constructor(private readonly createUserUseCase: CreateUserUseCase) {
        super()
    }

    protected async execute(input: ControllerInput<typeof createUserSchema>) {
        const user = await this.createUserUseCase.execute(input)

        return {
            statusCode: 201,
            body: user,
        }
    }
}
