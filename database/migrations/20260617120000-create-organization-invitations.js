'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            DO $$
            BEGIN
                CREATE TYPE organization_invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;

            CREATE TABLE organization_invitations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                email VARCHAR(180) NOT NULL,
                invited_by_user_id UUID NOT NULL REFERENCES users(id),
                token_hash TEXT NOT NULL,
                status organization_invitation_status NOT NULL DEFAULT 'PENDING',
                expires_at TIMESTAMPTZ NOT NULL,
                accepted_at TIMESTAMPTZ,
                cancelled_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE UNIQUE INDEX organization_invitations_pending_email_unique
                ON organization_invitations (organization_id, email)
                WHERE status = 'PENDING';

            CREATE INDEX organization_invitations_organization_id_idx
                ON organization_invitations (organization_id);

            CREATE INDEX organization_invitations_token_hash_idx
                ON organization_invitations (token_hash);

            CREATE INDEX organization_invitations_invited_by_user_id_idx
                ON organization_invitations (invited_by_user_id);

            CREATE TABLE organization_invitation_roles (
                invitation_id UUID NOT NULL REFERENCES organization_invitations(id),
                role_id UUID NOT NULL REFERENCES roles(id),
                PRIMARY KEY (invitation_id, role_id)
            );

            CREATE INDEX organization_invitation_roles_role_id_idx
                ON organization_invitation_roles (role_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS organization_invitation_roles;
            DROP TABLE IF EXISTS organization_invitations;
            DROP TYPE IF EXISTS organization_invitation_status;
        `)
    },
}
