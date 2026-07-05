'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE hr_employee_assignments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                employee_id UUID NOT NULL REFERENCES hr_employees(id),
                department_id UUID NOT NULL REFERENCES hr_departments(id),
                position_id UUID NOT NULL REFERENCES hr_positions(id),
                effective_date DATE NOT NULL,
                reason VARCHAR(500),
                created_by UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE hr_salary_changes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                employee_id UUID NOT NULL REFERENCES hr_employees(id),
                pay_amount NUMERIC(15, 2) NOT NULL,
                contract_type VARCHAR(20) NOT NULL,
                pay_frequency VARCHAR(20) NOT NULL,
                estimated_monthly_units NUMERIC(10, 4) NOT NULL,
                contract_start_date DATE NOT NULL,
                contract_end_date DATE,
                effective_date DATE NOT NULL,
                reason VARCHAR(500),
                created_by UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT hr_salary_changes_pay_amount_check CHECK (pay_amount > 0),
                CONSTRAINT hr_salary_changes_estimated_units_check
                    CHECK (estimated_monthly_units > 0),
                CONSTRAINT hr_salary_changes_contract_type_check
                    CHECK (contract_type IN ('CLT', 'TEMPORARY', 'PJ', 'FREELANCER')),
                CONSTRAINT hr_salary_changes_pay_frequency_check
                    CHECK (pay_frequency IN ('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'DAILY', 'HOURLY')),
                CONSTRAINT hr_salary_changes_contract_dates_check CHECK (
                    contract_end_date IS NULL OR contract_end_date >= contract_start_date
                ),
                CONSTRAINT hr_salary_changes_temporary_end_date_check CHECK (
                    contract_type <> 'TEMPORARY' OR contract_end_date IS NOT NULL
                ),
                CONSTRAINT hr_salary_changes_clt_end_date_check CHECK (
                    contract_type <> 'CLT' OR contract_end_date IS NULL
                )
            );

            CREATE INDEX hr_employee_assignments_employee_date_idx
                ON hr_employee_assignments (employee_id, effective_date DESC);
            CREATE INDEX hr_employee_assignments_organization_idx
                ON hr_employee_assignments (organization_id);
            CREATE INDEX hr_salary_changes_employee_date_idx
                ON hr_salary_changes (employee_id, effective_date DESC);
            CREATE INDEX hr_salary_changes_organization_idx
                ON hr_salary_changes (organization_id);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DROP TABLE IF EXISTS hr_salary_changes;
            DROP TABLE IF EXISTS hr_employee_assignments;
        `)
    },
}
