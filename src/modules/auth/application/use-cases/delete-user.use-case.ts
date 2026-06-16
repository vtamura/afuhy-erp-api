import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { UserRepository } from '../../domain/repositories/user.repository'

type DeleteUserUseCaseInput = {
    id: string
    authenticatedUserId: string
    organizationId: string
}

export class DeleteUserUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    async execute(input: DeleteUserUseCaseInput): Promise<void> {
        if (input.id === input.authenticatedUserId) {
            throw new ForbiddenError(
                'Voce nao pode excluir seu proprio usuario',
            )
        }

        const user = await this.userRepository.findByIdInOrganization({
            id: input.id,
            organizationId: input.organizationId,
        })

        if (!user) {
            throw new NotFoundError('Usuario nao encontrado')
        }

        const deleted = await this.userRepository.softDeleteInOrganization({
            id: input.id,
            organizationId: input.organizationId,
        })

        if (!deleted) {
            throw new NotFoundError('Usuario nao encontrado')
        }
    }
}
