'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE organization_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                user_id UUID NOT NULL REFERENCES users(id),
                status company_user_status NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT organization_users_organization_id_user_id_unique UNIQUE (organization_id, user_id)
            );

            CREATE INDEX organization_users_organization_id_idx
                ON organization_users (organization_id);

            CREATE INDEX organization_users_user_id_idx
                ON organization_users (user_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS organization_users;
        `)
    },
}
