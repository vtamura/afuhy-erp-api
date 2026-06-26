'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE organization_billing_profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                stripe_customer_id VARCHAR(255) NOT NULL,
                billing_email VARCHAR(180),
                metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT organization_billing_profiles_organization_unique UNIQUE (organization_id),
                CONSTRAINT organization_billing_profiles_stripe_customer_unique UNIQUE (stripe_customer_id)
            );

            ALTER TABLE subscriptions
                ADD COLUMN stripe_price_id VARCHAR(255),
                ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
                ADD COLUMN current_period_start TIMESTAMPTZ,
                ADD COLUMN current_period_end TIMESTAMPTZ,
                ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
                ADD CONSTRAINT subscriptions_source_check CHECK (source IN ('MANUAL', 'STRIPE'));

            CREATE UNIQUE INDEX subscriptions_stripe_subscription_unique
                ON subscriptions (stripe_subscription_id)
                WHERE stripe_subscription_id IS NOT NULL;

            CREATE INDEX subscriptions_stripe_customer_id_idx
                ON subscriptions (stripe_customer_id)
                WHERE stripe_customer_id IS NOT NULL;

            CREATE TABLE stripe_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                stripe_event_id VARCHAR(255) NOT NULL,
                type VARCHAR(150) NOT NULL,
                api_version VARCHAR(50),
                livemode BOOLEAN NOT NULL DEFAULT FALSE,
                payload JSONB NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
                received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                processed_at TIMESTAMPTZ,
                error TEXT,
                CONSTRAINT stripe_events_stripe_event_unique UNIQUE (stripe_event_id),
                CONSTRAINT stripe_events_status_check CHECK (status IN ('PROCESSING', 'PROCESSED', 'FAILED'))
            );

            CREATE INDEX stripe_events_type_idx
                ON stripe_events (type);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS stripe_events;

            DROP INDEX IF EXISTS subscriptions_stripe_customer_id_idx;
            DROP INDEX IF EXISTS subscriptions_stripe_subscription_unique;

            ALTER TABLE subscriptions
                DROP CONSTRAINT IF EXISTS subscriptions_source_check,
                DROP COLUMN IF EXISTS cancel_at_period_end,
                DROP COLUMN IF EXISTS current_period_end,
                DROP COLUMN IF EXISTS current_period_start,
                DROP COLUMN IF EXISTS source,
                DROP COLUMN IF EXISTS stripe_price_id;

            DROP TABLE IF EXISTS organization_billing_profiles;
        `)
    },
}
