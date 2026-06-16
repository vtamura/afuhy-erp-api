import { BaseController } from '../../../../../shared/presentation/http/controllers'
import { listUsersSchema } from '../../../application/contracts'
import type { UserResponseDto } from '../../../application/dto'
import type { ListUsersUseCase } from '../../../application/use-cases'

export class ListUsersController extends BaseController<
    typeof listUsersSchema,
    UserResponseDto[]
> {
    protected readonly schema = listUsersSchema

    constructor(private readonly listUsersUseCase: ListUsersUseCase) {
        super()
    }

    protected execute(): Promise<UserResponseDto[]> {
        return this.listUsersUseCase.execute()
    }
}
