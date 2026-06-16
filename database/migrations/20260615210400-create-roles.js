'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID REFERENCES organizations(id),
                name VARCHAR(100) NOT NULL,
                code VARCHAR(100) NOT NULL,
                is_system BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX roles_organization_id_idx
                ON roles (organization_id);

            CREATE UNIQUE INDEX roles_system_code_unique
                ON roles (code)
                WHERE organization_id IS NULL;

            CREATE UNIQUE INDEX roles_organization_id_code_unique
                ON roles (organization_id, code)
                WHERE organization_id IS NOT NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS roles;
        `)
    },
}
