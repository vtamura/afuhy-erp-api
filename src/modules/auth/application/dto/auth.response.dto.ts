import type { UserResponseDto } from './user.response.dto'
import type { OrganizationResponseDto } from './organization.response.dto'

export type SessionResponseDto = {
    id: string
    organizationId: string | null
    expiresAt: string
}

export type AuthResponseDto = {
    user: UserResponseDto
    session: SessionResponseDto
    organizations: OrganizationResponseDto[]
    tokens?: {
        accessToken: string
        refreshToken: string
    }
}
