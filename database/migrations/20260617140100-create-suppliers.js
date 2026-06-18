'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE suppliers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                name VARCHAR(150) NOT NULL,
                document VARCHAR(32),
                document_type VARCHAR(20),
                email VARCHAR(180),
                phone VARCHAR(40),
                notes TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT suppliers_document_type_check
                    CHECK (document_type IS NULL OR document_type IN ('CPF', 'CNPJ', 'OTHER')),
                CONSTRAINT suppliers_status_check
                    CHECK (status IN ('ACTIVE', 'INACTIVE'))
            );

            CREATE INDEX suppliers_organization_id_idx
                ON suppliers (organization_id);

            CREATE INDEX suppliers_organization_name_idx
                ON suppliers (organization_id, name);

            CREATE UNIQUE INDEX suppliers_organization_document_unique
                ON suppliers (organization_id, document)
                WHERE document IS NOT NULL
                    AND deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS suppliers;')
    },
}
