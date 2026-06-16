import type { SessionRepository } from '../../domain/repositories/session.repository'
import type { ManagedSessionResponseDto } from '../dto'
import { toManagedSessionResponseDto } from '../mappers/session-management-response.mapper'

export class ListSessionsUseCase {
    constructor(private readonly sessionRepository: SessionRepository) {}

    async execute(userId: string): Promise<ManagedSessionResponseDto[]> {
        const sessions = await this.sessionRepository.listActiveByUserId(userId)
        return sessions.map(toManagedSessionResponseDto)
    }
}
