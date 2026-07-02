'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE hr_payroll_provisions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                amount NUMERIC(15, 2) NOT NULL,
                employee_count INTEGER NOT NULL,
                financial_payable_id UUID NOT NULL REFERENCES financial_transactions(id),
                created_by UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT hr_payroll_provisions_month_check
                    CHECK (month BETWEEN 1 AND 12),
                CONSTRAINT hr_payroll_provisions_year_check
                    CHECK (year BETWEEN 2000 AND 2100),
                CONSTRAINT hr_payroll_provisions_amount_check
                    CHECK (amount > 0),
                CONSTRAINT hr_payroll_provisions_employee_count_check
                    CHECK (employee_count > 0)
            );

            CREATE UNIQUE INDEX hr_payroll_provisions_period_unique
                ON hr_payroll_provisions (organization_id, year, month);

            CREATE INDEX hr_payroll_provisions_financial_payable_idx
                ON hr_payroll_provisions (financial_payable_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS hr_payroll_provisions;',
        )
    },
}
