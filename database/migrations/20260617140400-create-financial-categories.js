'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE financial_categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                name VARCHAR(150) NOT NULL,
                type VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT financial_categories_type_check
                    CHECK (type IN ('INCOME', 'EXPENSE')),
                CONSTRAINT financial_categories_status_check
                    CHECK (status IN ('ACTIVE', 'INACTIVE'))
            );

            CREATE INDEX financial_categories_organization_id_idx
                ON financial_categories (organization_id);

            CREATE INDEX financial_categories_organization_status_idx
                ON financial_categories (organization_id, status)
                WHERE deleted_at IS NULL;

            CREATE UNIQUE INDEX financial_categories_organization_type_name_unique
                ON financial_categories (organization_id, type, LOWER(name))
                WHERE deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS financial_categories;',
        )
    },
}
