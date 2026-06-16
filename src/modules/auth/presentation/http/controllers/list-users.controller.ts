import { BaseController } from '../../../../../shared/presentation/http/controllers'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import { listUsersSchema } from '../../../application/contracts'
import type { UserResponseDto } from '../../../application/dto'
import type { ListUsersUseCase } from '../../../application/use-cases'
import type { ControllerInput } from '../../../../../shared/presentation/http/controllers'

export class ListUsersController extends BaseController<
    typeof listUsersSchema,
    UserResponseDto[]
> {
    protected readonly schema = listUsersSchema

    constructor(private readonly listUsersUseCase: ListUsersUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listUsersSchema>,
    ): Promise<UserResponseDto[]> {
        if (!input.authUser.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        return this.listUsersUseCase.execute(input.authUser.organizationId)
    }
}
