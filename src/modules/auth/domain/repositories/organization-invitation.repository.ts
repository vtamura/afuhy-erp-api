import type { OrganizationInvitationEntity } from '../entities/organization-invitation.entity'

export type CreateOrganizationInvitationInput = {
    organizationId: string
    email: string
    invitedByUserId: string
    tokenHash: string
    expiresAt: Date
    roleIds: string[]
}

export type RotateOrganizationInvitationInput = {
    invitationId: string
    tokenHash: string
    expiresAt: Date
    roleIds: string[]
}

export interface OrganizationInvitationRepository {
    create(
        input: CreateOrganizationInvitationInput,
    ): Promise<OrganizationInvitationEntity>
    rotatePending(
        input: RotateOrganizationInvitationInput,
    ): Promise<OrganizationInvitationEntity>
    findPendingByOrganizationAndEmail(input: {
        organizationId: string
        email: string
    }): Promise<OrganizationInvitationEntity | null>
    findByTokenHash(
        tokenHash: string,
    ): Promise<OrganizationInvitationEntity | null>
    listPendingByOrganization(
        organizationId: string,
    ): Promise<OrganizationInvitationEntity[]>
    cancelPending(input: {
        organizationId: string
        invitationId: string
    }): Promise<boolean>
    markAsAccepted(invitationId: string): Promise<void>
}
