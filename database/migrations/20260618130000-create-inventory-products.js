'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE inventory_products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                name VARCHAR(180) NOT NULL,
                description TEXT,
                unit VARCHAR(10) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT inventory_products_unit_check
                    CHECK (unit IN ('UN', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'CX')),
                CONSTRAINT inventory_products_status_check
                    CHECK (status IN ('ACTIVE', 'INACTIVE'))
            );

            CREATE INDEX inventory_products_organization_id_idx
                ON inventory_products (organization_id);
            CREATE INDEX inventory_products_organization_name_idx
                ON inventory_products (organization_id, name)
                WHERE deleted_at IS NULL;
            CREATE INDEX inventory_products_organization_status_idx
                ON inventory_products (organization_id, status)
                WHERE deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS inventory_products;',
        )
    },
}
