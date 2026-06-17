import type { OrganizationEntity } from '../../domain/entities/organization.entity'
import type { OrganizationInvitationEntity } from '../../domain/entities/organization-invitation.entity'
import type { OrganizationMember } from '../../domain/repositories/organization-user.repository'
import type { RoleEntity } from '../../domain/repositories/role.repository'
import type {
    OrganizationInvitationResponseDto,
    OrganizationMemberResponseDto,
    OrganizationRoleResponseDto,
    OrganizationResponseDto,
} from '../dto'

export function toOrganizationResponseDto(
    organization: OrganizationEntity,
): OrganizationResponseDto {
    return {
        id: organization.id,
        name: organization.name,
        document: organization.document,
        documentType: organization.documentType,
        status: organization.status,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
    }
}

export function toOrganizationMemberResponseDto(
    member: OrganizationMember,
): OrganizationMemberResponseDto {
    return {
        organizationUserId: member.organizationUserId,
        userId: member.userId,
        name: member.name,
        email: member.email,
        status: member.status,
        roles: member.roles,
        createdAt: member.createdAt.toISOString(),
    }
}

export function toOrganizationRoleResponseDto(
    role: RoleEntity,
): OrganizationRoleResponseDto {
    return {
        id: role.id,
        code: role.code,
        name: role.name,
        isSystem: role.isSystem,
        createdAt: role.createdAt.toISOString(),
    }
}

export function toOrganizationInvitationResponseDto(
    invitation: OrganizationInvitationEntity,
    invitationToken?: string,
): OrganizationInvitationResponseDto {
    return {
        id: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
        acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
        cancelledAt: invitation.cancelledAt?.toISOString() ?? null,
        createdAt: invitation.createdAt.toISOString(),
        updatedAt: invitation.updatedAt.toISOString(),
        roles: invitation.roles,
        invitationToken,
    }
}
