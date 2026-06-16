'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;

            DO $$
            BEGIN
                CREATE TYPE organization_document_type AS ENUM ('CPF', 'CNPJ');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;

            DO $$
            BEGIN
                CREATE TYPE organization_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;

            DO $$
            BEGIN
                CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;

            DO $$
            BEGIN
                CREATE TYPE company_user_status AS ENUM ('ACTIVE', 'INACTIVE');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;

            DO $$
            BEGIN
                CREATE TYPE session_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;

            DO $$
            BEGIN
                CREATE TYPE plan_type AS ENUM ('FREE', 'STARTER', 'GROWTH', 'BUSINESS');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;

            DO $$
            BEGIN
                CREATE TYPE subscription_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS subscription_status;
            DROP TYPE IF EXISTS plan_type;
            DROP TYPE IF EXISTS session_status;
            DROP TYPE IF EXISTS company_user_status;
            DROP TYPE IF EXISTS user_status;
            DROP TYPE IF EXISTS organization_status;
            DROP TYPE IF EXISTS organization_document_type;
        `)
    },
}
