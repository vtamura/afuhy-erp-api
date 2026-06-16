'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                plan_id UUID NOT NULL REFERENCES plans(id),
                stripe_customer_id VARCHAR(255),
                stripe_subscription_id VARCHAR(255),
                status subscription_status NOT NULL,
                starts_at TIMESTAMPTZ NOT NULL,
                ends_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX subscriptions_organization_id_idx
                ON subscriptions (organization_id);

            CREATE INDEX subscriptions_plan_id_idx
                ON subscriptions (plan_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS subscriptions;
        `)
    },
}
