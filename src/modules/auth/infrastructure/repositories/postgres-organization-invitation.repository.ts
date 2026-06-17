import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import {
    OrganizationInvitationEntity,
    type OrganizationInvitationRole,
    type OrganizationInvitationStatus,
} from '../../domain/entities/organization-invitation.entity'
import type {
    CreateOrganizationInvitationInput,
    OrganizationInvitationRepository,
    RotateOrganizationInvitationInput,
} from '../../domain/repositories/organization-invitation.repository'

type OrganizationInvitationRow = {
    id: string
    organization_id: string
    email: string
    invited_by_user_id: string
    token_hash: string
    status: OrganizationInvitationStatus
    expires_at: Date
    accepted_at: Date | null
    cancelled_at: Date | null
    created_at: Date
    updated_at: Date
    roles: OrganizationInvitationRole[] | null
}

export class PostgresOrganizationInvitationRepository implements OrganizationInvitationRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(
        input: CreateOrganizationInvitationInput,
    ): Promise<OrganizationInvitationEntity> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const [row] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO organization_invitations (
                        organization_id,
                        email,
                        invited_by_user_id,
                        token_hash,
                        expires_at
                    )
                    VALUES (
                        :organizationId,
                        :email,
                        :invitedByUserId,
                        :tokenHash,
                        :expiresAt
                    )
                    RETURNING id
                `,
                input,
            )

            await this.replaceRoles(databaseClient, row.id, input.roleIds)

            const invitation = await this.findById(row.id, databaseClient)

            if (!invitation) {
                throw new Error('Organization invitation could not be created')
            }

            return invitation
        })
    }

    async rotatePending(
        input: RotateOrganizationInvitationInput,
    ): Promise<OrganizationInvitationEntity> {
        return this.databaseClient.transaction(async (databaseClient) => {
            await databaseClient.query(
                `
                    UPDATE organization_invitations
                    SET token_hash = :tokenHash,
                        expires_at = :expiresAt,
                        updated_at = NOW()
                    WHERE id = :invitationId
                        AND status = 'PENDING'
                `,
                input,
            )

            await this.replaceRoles(
                databaseClient,
                input.invitationId,
                input.roleIds,
            )

            const invitation = await this.findById(
                input.invitationId,
                databaseClient,
            )

            if (!invitation) {
                throw new Error('Organization invitation could not be rotated')
            }

            return invitation
        })
    }

    async findPendingByOrganizationAndEmail(input: {
        organizationId: string
        email: string
    }): Promise<OrganizationInvitationEntity | null> {
        const [invitation] = await this.findMany(
            `
                WHERE invitations.organization_id = :organizationId
                    AND invitations.email = :email
                    AND invitations.status = 'PENDING'
            `,
            input,
            'LIMIT 1',
        )

        return invitation ?? null
    }

    async findByTokenHash(
        tokenHash: string,
    ): Promise<OrganizationInvitationEntity | null> {
        const [invitation] = await this.findMany(
            `
                WHERE invitations.token_hash = :tokenHash
            `,
            { tokenHash },
            'LIMIT 1',
        )

        return invitation ?? null
    }

    async listPendingByOrganization(
        organizationId: string,
    ): Promise<OrganizationInvitationEntity[]> {
        return this.findMany(
            `
                WHERE invitations.organization_id = :organizationId
                    AND invitations.status = 'PENDING'
                    AND invitations.expires_at > NOW()
            `,
            { organizationId },
            'ORDER BY invitations.created_at DESC',
        )
    }

    async cancelPending(input: {
        organizationId: string
        invitationId: string
    }): Promise<boolean> {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE organization_invitations
                SET status = 'CANCELLED',
                    cancelled_at = NOW(),
                    updated_at = NOW()
                WHERE id = :invitationId
                    AND organization_id = :organizationId
                    AND status = 'PENDING'
                    AND expires_at > NOW()
                RETURNING id
            `,
            input,
        )

        return rows.length > 0
    }

    async markAsAccepted(invitationId: string): Promise<void> {
        await this.databaseClient.query(
            `
                UPDATE organization_invitations
                SET status = 'ACCEPTED',
                    accepted_at = NOW(),
                    updated_at = NOW()
                WHERE id = :invitationId
                    AND status = 'PENDING'
            `,
            { invitationId },
        )
    }

    private async findById(
        invitationId: string,
        databaseClient: DatabaseClient = this.databaseClient,
    ): Promise<OrganizationInvitationEntity | null> {
        const [invitation] = await this.findMany(
            `
                WHERE invitations.id = :invitationId
            `,
            { invitationId },
            'LIMIT 1',
            databaseClient,
        )

        return invitation ?? null
    }

    private async replaceRoles(
        databaseClient: DatabaseClient,
        invitationId: string,
        roleIds: string[],
    ): Promise<void> {
        await databaseClient.query(
            `
                DELETE FROM organization_invitation_roles
                WHERE invitation_id = :invitationId
            `,
            { invitationId },
        )

        if (!roleIds.length) {
            return
        }

        await databaseClient.query(
            `
                INSERT INTO organization_invitation_roles (invitation_id, role_id)
                SELECT :invitationId, roles.id
                FROM roles
                WHERE roles.id IN (:roleIds)
                ON CONFLICT DO NOTHING
            `,
            { invitationId, roleIds },
        )
    }

    private async findMany(
        whereClause: string,
        replacements: Record<string, unknown>,
        suffix = '',
        databaseClient: DatabaseClient = this.databaseClient,
    ): Promise<OrganizationInvitationEntity[]> {
        const rows = await databaseClient.select<OrganizationInvitationRow>(
            `
                SELECT
                    invitations.id,
                    invitations.organization_id,
                    invitations.email,
                    invitations.invited_by_user_id,
                    invitations.token_hash,
                    invitations.status,
                    invitations.expires_at,
                    invitations.accepted_at,
                    invitations.cancelled_at,
                    invitations.created_at,
                    invitations.updated_at,
                    COALESCE(
                        JSONB_AGG(
                            JSONB_BUILD_OBJECT(
                                'id', roles.id,
                                'code', roles.code,
                                'name', roles.name,
                                'isSystem', roles.is_system
                            )
                            ORDER BY roles.name
                        ) FILTER (WHERE roles.id IS NOT NULL),
                        '[]'::jsonb
                    ) AS roles
                FROM organization_invitations invitations
                LEFT JOIN organization_invitation_roles invitation_roles
                    ON invitation_roles.invitation_id = invitations.id
                LEFT JOIN roles
                    ON roles.id = invitation_roles.role_id
                ${whereClause}
                GROUP BY invitations.id
                ${suffix}
            `,
            replacements,
        )

        return rows.map((row) => this.toEntity(row))
    }

    private toEntity(
        row: OrganizationInvitationRow,
    ): OrganizationInvitationEntity {
        return OrganizationInvitationEntity.create({
            id: row.id,
            organizationId: row.organization_id,
            email: row.email,
            invitedByUserId: row.invited_by_user_id,
            tokenHash: row.token_hash,
            status: row.status,
            expiresAt: new Date(row.expires_at),
            acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
            cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            roles: row.roles ?? [],
        })
    }
}
