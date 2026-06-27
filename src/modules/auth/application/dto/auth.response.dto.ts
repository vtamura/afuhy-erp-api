import type { UserResponseDto } from './user.response.dto'
import type { OrganizationResponseDto } from './organization.response.dto'

export type SessionResponseDto = {
    id: string
    organizationId: string | null
    expiresAt: string
}

export type CurrentMembershipResponseDto = {
    organizationUserId: string
    userId: string
    status: 'ACTIVE'
    roles: Array<{
        id: string
        code: string
        name: string
        isSystem: boolean
    }>
    permissions: string[]
    createdAt: string
}

export type AuthResponseDto = {
    user: UserResponseDto
    session: SessionResponseDto
    organizations: OrganizationResponseDto[]
    currentOrganization: OrganizationResponseDto | null
    currentMembership: CurrentMembershipResponseDto | null
    tokens?: {
        accessToken: string
        refreshToken: string
    }
}
