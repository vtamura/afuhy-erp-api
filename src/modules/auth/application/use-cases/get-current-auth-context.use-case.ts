import { UnauthorizedError } from '../../../../shared/domain/errors'
import type { OrganizationRepository } from '../../domain/repositories/organization.repository'
import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { UserRepository } from '../../domain/repositories/user.repository'
import type { AuthResponseDto } from '../dto'
import { toOrganizationResponseDto } from '../mappers/organization-response.mapper'
import { toSessionResponseDto } from '../mappers/session-response.mapper'
import { toUserResponseDto } from '../mappers/user-response.mapper'
import type { AuthContextService } from '../services/auth-context.service'

type GetCurrentAuthContextUseCaseInput = {
    userId: string
    sessionId: string
}

export class GetCurrentAuthContextUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly sessionRepository: SessionRepository,
        private readonly organizationRepository: OrganizationRepository,
        private readonly authContextService: AuthContextService,
    ) {}

    async execute(
        input: GetCurrentAuthContextUseCaseInput,
    ): Promise<AuthResponseDto> {
        const user = await this.userRepository.findById(input.userId)

        if (!user || !user.isActive) {
            throw new UnauthorizedError('Usuario invalido')
        }

        const session = await this.sessionRepository.findById(input.sessionId)

        if (!session || !session.isActive || session.userId !== user.id) {
            throw new UnauthorizedError('Sessao invalida')
        }

        const organizations = await this.organizationRepository.listByUserId(
            user.id,
        )
        const context = await this.authContextService.resolve({
            userId: user.id,
            organizationId: session.organizationId,
        })

        return {
            user: toUserResponseDto(user),
            session: toSessionResponseDto(session),
            organizations: organizations.map(toOrganizationResponseDto),
            ...context,
        }
    }
}
