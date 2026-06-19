'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE inventory_variants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                product_id UUID NOT NULL REFERENCES inventory_products(id),
                name VARCHAR(150) NOT NULL,
                sku VARCHAR(100) NOT NULL,
                barcode VARCHAR(100),
                sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
                average_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
                current_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,
                minimum_quantity NUMERIC(15, 3) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT inventory_variants_sale_price_check
                    CHECK (sale_price >= 0),
                CONSTRAINT inventory_variants_average_cost_check
                    CHECK (average_cost >= 0),
                CONSTRAINT inventory_variants_current_quantity_check
                    CHECK (current_quantity >= 0),
                CONSTRAINT inventory_variants_minimum_quantity_check
                    CHECK (minimum_quantity >= 0),
                CONSTRAINT inventory_variants_status_check
                    CHECK (status IN ('ACTIVE', 'INACTIVE'))
            );

            CREATE INDEX inventory_variants_organization_id_idx
                ON inventory_variants (organization_id);
            CREATE INDEX inventory_variants_product_id_idx
                ON inventory_variants (product_id);
            CREATE INDEX inventory_variants_organization_status_idx
                ON inventory_variants (organization_id, status)
                WHERE deleted_at IS NULL;
            CREATE UNIQUE INDEX inventory_variants_organization_sku_unique
                ON inventory_variants (organization_id, sku)
                WHERE deleted_at IS NULL;
            CREATE UNIQUE INDEX inventory_variants_organization_barcode_unique
                ON inventory_variants (organization_id, barcode)
                WHERE barcode IS NOT NULL AND deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS inventory_variants;',
        )
    },
}
