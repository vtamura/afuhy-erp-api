import type { UserEntity } from '../../domain/entities/user.entity'
import type { UserResponseDto } from '../dto'

export function toUserResponseDto(user: UserEntity): UserResponseDto {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        deletedAt: user.deletedAt?.toISOString() ?? null,
    }
}
