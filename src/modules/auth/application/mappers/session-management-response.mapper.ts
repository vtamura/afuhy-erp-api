import type { SessionEntity } from '../../domain/entities/session.entity'
import type { ManagedSessionResponseDto } from '../dto'

export function toManagedSessionResponseDto(
    session: SessionEntity,
): ManagedSessionResponseDto {
    return {
        id: session.id,
        organizationId: session.organizationId,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        status: session.status,
        expiresAt: session.expiresAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
    }
}
