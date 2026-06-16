'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id),
                organization_id UUID REFERENCES organizations(id),
                refresh_token_hash TEXT NOT NULL,
                user_agent TEXT,
                ip_address VARCHAR(100),
                status session_status NOT NULL DEFAULT 'ACTIVE',
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX sessions_user_id_idx
                ON sessions (user_id);

            CREATE INDEX sessions_organization_id_idx
                ON sessions (organization_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS sessions;
        `)
    },
}
