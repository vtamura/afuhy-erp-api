import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { UserRepository } from '../../domain/repositories/user.repository'

type DeleteUserUseCaseInput = {
    id: string
    authenticatedUserId: string
}

export class DeleteUserUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: DeleteUserUseCaseInput): Promise<void> {
        if (input.id === input.authenticatedUserId) {
            throw new ForbiddenError(
                'Voce nao pode excluir seu proprio usuario',
            )
        }

        const user = await this.userRepository.findById(input.id)

        if (!user) {
            throw new NotFoundError('Usuario nao encontrado')
        }

        const deleted = await this.userRepository.softDelete(input.id)

        if (!deleted) {
            throw new NotFoundError('Usuario nao encontrado')
        }
    }
}
