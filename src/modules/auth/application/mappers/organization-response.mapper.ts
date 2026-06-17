import type { OrganizationEntity } from '../../domain/entities/organization.entity'
import type { OrganizationMember } from '../../domain/repositories/organization-user.repository'
import type { RoleEntity } from '../../domain/repositories/role.repository'
import type {
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
