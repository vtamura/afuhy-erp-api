'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE plans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code plan_type NOT NULL,
                name VARCHAR(100) NOT NULL,
                price_cents INTEGER NOT NULL,
                currency CHAR(3) NOT NULL DEFAULT 'BRL',
                billing_interval VARCHAR(20) NOT NULL DEFAULT 'MONTH',
                max_users INTEGER NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT plans_code_unique UNIQUE (code),
                CONSTRAINT plans_price_cents_non_negative CHECK (price_cents >= 0),
                CONSTRAINT plans_max_users_positive CHECK (max_users > 0),
                CONSTRAINT plans_billing_interval_check CHECK (billing_interval IN ('MONTH', 'YEAR'))
            );
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS plans;
        `)
    },
}
