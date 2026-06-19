'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE inventory_movements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                product_id UUID NOT NULL REFERENCES inventory_products(id),
                variant_id UUID NOT NULL REFERENCES inventory_variants(id),
                type VARCHAR(20) NOT NULL,
                quantity NUMERIC(15, 3) NOT NULL,
                unit_cost NUMERIC(15, 2) NOT NULL,
                total_cost NUMERIC(18, 2) NOT NULL,
                supplier_id UUID REFERENCES suppliers(id),
                reason VARCHAR(255),
                notes TEXT,
                movement_date TIMESTAMPTZ NOT NULL,
                created_by UUID NOT NULL REFERENCES users(id),
                reversal_of_movement_id UUID REFERENCES inventory_movements(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT inventory_movements_type_check
                    CHECK (type IN ('ENTRY', 'EXIT', 'ADJUSTMENT')),
                CONSTRAINT inventory_movements_quantity_check
                    CHECK (quantity <> 0),
                CONSTRAINT inventory_movements_unit_cost_check
                    CHECK (unit_cost >= 0),
                CONSTRAINT inventory_movements_total_cost_check
                    CHECK (total_cost >= 0)
            );

            CREATE INDEX inventory_movements_organization_id_idx
                ON inventory_movements (organization_id);
            CREATE INDEX inventory_movements_product_id_idx
                ON inventory_movements (product_id);
            CREATE INDEX inventory_movements_variant_id_idx
                ON inventory_movements (variant_id);
            CREATE INDEX inventory_movements_organization_type_date_idx
                ON inventory_movements (
                    organization_id,
                    type,
                    movement_date DESC
                );
            CREATE INDEX inventory_movements_supplier_id_idx
                ON inventory_movements (supplier_id)
                WHERE supplier_id IS NOT NULL;
            CREATE UNIQUE INDEX inventory_movements_reversal_unique
                ON inventory_movements (reversal_of_movement_id)
                WHERE reversal_of_movement_id IS NOT NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS inventory_movements;',
        )
    },
}
