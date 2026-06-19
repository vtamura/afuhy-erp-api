'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE hr_departments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                name VARCHAR(150) NOT NULL,
                description TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT hr_departments_status_check
                    CHECK (status IN ('ACTIVE', 'INACTIVE'))
            );

            CREATE INDEX hr_departments_organization_id_idx
                ON hr_departments (organization_id);
            CREATE UNIQUE INDEX hr_departments_organization_name_unique
                ON hr_departments (organization_id, LOWER(name))
                WHERE deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS hr_departments;',
        )
    },
}
