'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE financial_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                name VARCHAR(150) NOT NULL,
                type VARCHAR(30) NOT NULL,
                initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT financial_accounts_type_check
                    CHECK (type IN ('CASH', 'BANK', 'DIGITAL_WALLET')),
                CONSTRAINT financial_accounts_status_check
                    CHECK (status IN ('ACTIVE', 'INACTIVE'))
            );

            CREATE INDEX financial_accounts_organization_id_idx
                ON financial_accounts (organization_id);

            CREATE INDEX financial_accounts_organization_status_idx
                ON financial_accounts (organization_id, status)
                WHERE deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS financial_accounts;',
        )
    },
}
