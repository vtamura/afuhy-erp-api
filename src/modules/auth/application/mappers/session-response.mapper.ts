import type { SessionEntity } from '../../domain/entities/session.entity'
import type { SessionResponseDto } from '../dto'

export function toSessionResponseDto(
    session: SessionEntity,
): SessionResponseDto {
    return {
        id: session.id,
        organizationId: session.organizationId,
        expiresAt: session.expiresAt.toISOString(),
    }
}
