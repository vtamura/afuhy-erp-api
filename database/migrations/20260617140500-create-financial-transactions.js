'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE financial_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                account_id UUID REFERENCES financial_accounts(id),
                category_id UUID NOT NULL REFERENCES financial_categories(id),
                customer_id UUID REFERENCES customers(id),
                supplier_id UUID REFERENCES suppliers(id),
                employee_id UUID,
                origin_type VARCHAR(40) NOT NULL DEFAULT 'MANUAL',
                origin_id UUID,
                description VARCHAR(255) NOT NULL,
                notes TEXT,
                type VARCHAR(20) NOT NULL,
                amount NUMERIC(15, 2) NOT NULL,
                transaction_date DATE NOT NULL,
                due_date DATE,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                paid_at TIMESTAMPTZ,
                canceled_at TIMESTAMPTZ,
                created_by UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT financial_transactions_type_check
                    CHECK (type IN ('INCOME', 'EXPENSE')),
                CONSTRAINT financial_transactions_status_check
                    CHECK (status IN ('PENDING', 'PAID', 'CANCELED')),
                CONSTRAINT financial_transactions_origin_type_check
                    CHECK (origin_type IN ('MANUAL', 'LOAN_CHARGE')),
                CONSTRAINT financial_transactions_amount_positive_check
                    CHECK (amount > 0),
                CONSTRAINT financial_transactions_paid_account_check
                    CHECK (status <> 'PAID' OR account_id IS NOT NULL),
                CONSTRAINT financial_transactions_counterparty_check
                    CHECK (
                        (
                            CASE WHEN customer_id IS NOT NULL THEN 1 ELSE 0 END
                            + CASE WHEN supplier_id IS NOT NULL THEN 1 ELSE 0 END
                            + CASE WHEN employee_id IS NOT NULL THEN 1 ELSE 0 END
                        ) <= 1
                    )
            );

            CREATE INDEX financial_transactions_organization_id_idx
                ON financial_transactions (organization_id);

            CREATE INDEX financial_transactions_account_id_idx
                ON financial_transactions (account_id);

            CREATE INDEX financial_transactions_category_id_idx
                ON financial_transactions (category_id);

            CREATE INDEX financial_transactions_customer_id_idx
                ON financial_transactions (customer_id)
                WHERE customer_id IS NOT NULL;

            CREATE INDEX financial_transactions_supplier_id_idx
                ON financial_transactions (supplier_id)
                WHERE supplier_id IS NOT NULL;

            CREATE INDEX financial_transactions_employee_id_idx
                ON financial_transactions (employee_id)
                WHERE employee_id IS NOT NULL;

            CREATE INDEX financial_transactions_origin_idx
                ON financial_transactions (organization_id, origin_type, origin_id)
                WHERE origin_id IS NOT NULL;

            CREATE INDEX financial_transactions_created_by_idx
                ON financial_transactions (created_by);

            CREATE INDEX financial_transactions_organization_status_date_idx
                ON financial_transactions (
                    organization_id,
                    status,
                    transaction_date DESC
                )
                WHERE deleted_at IS NULL;

            CREATE INDEX financial_transactions_organization_due_date_idx
                ON financial_transactions (organization_id, due_date)
                WHERE due_date IS NOT NULL
                    AND deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS financial_transactions;',
        )
    },
}
