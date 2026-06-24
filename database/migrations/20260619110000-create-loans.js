'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE loans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                borrower_type VARCHAR(20) NOT NULL,
                customer_id UUID REFERENCES customers(id),
                employee_id UUID REFERENCES hr_employees(id),
                status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
                expected_return_date DATE NOT NULL,
                released_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ,
                canceled_at TIMESTAMPTZ,
                notes TEXT,
                created_by UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT loans_borrower_type_check
                    CHECK (borrower_type IN ('CUSTOMER', 'EMPLOYEE')),
                CONSTRAINT loans_status_check
                    CHECK (status IN (
                        'DRAFT',
                        'RELEASED',
                        'PARTIALLY_RETURNED',
                        'COMPLETED',
                        'CANCELED'
                    )),
                CONSTRAINT loans_borrower_check
                    CHECK (
                        (borrower_type = 'CUSTOMER'
                            AND customer_id IS NOT NULL
                            AND employee_id IS NULL)
                        OR (borrower_type = 'EMPLOYEE'
                            AND employee_id IS NOT NULL
                            AND customer_id IS NULL)
                    )
            );

            CREATE TABLE loan_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                loan_id UUID NOT NULL REFERENCES loans(id),
                variant_id UUID NOT NULL REFERENCES inventory_variants(id),
                quantity_released NUMERIC(15, 3) NOT NULL,
                quantity_returned NUMERIC(15, 3) NOT NULL DEFAULT 0,
                quantity_lost NUMERIC(15, 3) NOT NULL DEFAULT 0,
                quantity_damaged NUMERIC(15, 3) NOT NULL DEFAULT 0,
                unit_cost_snapshot NUMERIC(15, 2) NOT NULL DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT loan_items_quantity_released_check
                    CHECK (quantity_released > 0),
                CONSTRAINT loan_items_quantities_non_negative_check
                    CHECK (
                        quantity_returned >= 0
                        AND quantity_lost >= 0
                        AND quantity_damaged >= 0
                    ),
                CONSTRAINT loan_items_resolved_quantity_check
                    CHECK (
                        quantity_returned + quantity_lost + quantity_damaged
                            <= quantity_released
                    )
            );

            CREATE TABLE loan_returns (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                loan_id UUID NOT NULL REFERENCES loans(id),
                returned_at TIMESTAMPTZ NOT NULL,
                notes TEXT,
                created_by UUID NOT NULL REFERENCES users(id),
                idempotency_key VARCHAR(120),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT loan_returns_idempotency_unique
                    UNIQUE (organization_id, loan_id, idempotency_key)
            );

            CREATE TABLE loan_return_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                loan_return_id UUID NOT NULL REFERENCES loan_returns(id),
                loan_item_id UUID NOT NULL REFERENCES loan_items(id),
                quantity NUMERIC(15, 3) NOT NULL,
                CONSTRAINT loan_return_items_quantity_check
                    CHECK (quantity > 0)
            );

            CREATE TABLE loan_occurrences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                loan_id UUID NOT NULL REFERENCES loans(id),
                type VARCHAR(20) NOT NULL,
                occurred_at TIMESTAMPTZ NOT NULL,
                description TEXT,
                created_by UUID NOT NULL REFERENCES users(id),
                idempotency_key VARCHAR(120),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT loan_occurrences_type_check
                    CHECK (type IN ('LOSS', 'DAMAGE')),
                CONSTRAINT loan_occurrences_idempotency_unique
                    UNIQUE (organization_id, loan_id, idempotency_key)
            );

            CREATE TABLE loan_occurrence_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                loan_occurrence_id UUID NOT NULL REFERENCES loan_occurrences(id),
                loan_item_id UUID NOT NULL REFERENCES loan_items(id),
                quantity NUMERIC(15, 3) NOT NULL,
                CONSTRAINT loan_occurrence_items_quantity_check
                    CHECK (quantity > 0)
            );

            CREATE TABLE loan_charges (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                loan_id UUID NOT NULL REFERENCES loans(id),
                occurrence_id UUID REFERENCES loan_occurrences(id),
                financial_transaction_id UUID REFERENCES financial_transactions(id),
                type VARCHAR(20) NOT NULL,
                category_id UUID NOT NULL REFERENCES financial_categories(id),
                amount NUMERIC(15, 2) NOT NULL,
                due_date DATE NOT NULL,
                description VARCHAR(255) NOT NULL,
                idempotency_key VARCHAR(120),
                created_by UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                canceled_at TIMESTAMPTZ,
                CONSTRAINT loan_charges_type_check
                    CHECK (type IN ('FEE', 'LATE_FEE', 'DAMAGE')),
                CONSTRAINT loan_charges_amount_check
                    CHECK (amount > 0),
                CONSTRAINT loan_charges_idempotency_unique
                    UNIQUE (organization_id, loan_id, type, idempotency_key)
            );

            CREATE INDEX loans_organization_status_idx
                ON loans (organization_id, status)
                WHERE deleted_at IS NULL;
            CREATE INDEX loans_customer_id_idx
                ON loans (customer_id)
                WHERE customer_id IS NOT NULL;
            CREATE INDEX loans_employee_id_idx
                ON loans (employee_id)
                WHERE employee_id IS NOT NULL;
            CREATE INDEX loan_items_loan_id_idx
                ON loan_items (loan_id);
            CREATE INDEX loan_items_variant_id_idx
                ON loan_items (variant_id);
            CREATE INDEX loan_returns_loan_id_idx
                ON loan_returns (loan_id);
            CREATE INDEX loan_occurrences_loan_id_idx
                ON loan_occurrences (loan_id);
            CREATE INDEX loan_charges_loan_id_idx
                ON loan_charges (loan_id);
            CREATE INDEX loan_charges_financial_transaction_id_idx
                ON loan_charges (financial_transaction_id)
                WHERE financial_transaction_id IS NOT NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS loan_charges;
            DROP TABLE IF EXISTS loan_occurrence_items;
            DROP TABLE IF EXISTS loan_occurrences;
            DROP TABLE IF EXISTS loan_return_items;
            DROP TABLE IF EXISTS loan_returns;
            DROP TABLE IF EXISTS loan_items;
            DROP TABLE IF EXISTS loans;
        `)
    },
}
