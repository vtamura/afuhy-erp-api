'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE hr_employees (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                organization_user_id UUID REFERENCES organization_users(id),
                department_id UUID NOT NULL REFERENCES hr_departments(id),
                position_id UUID NOT NULL REFERENCES hr_positions(id),
                name VARCHAR(180) NOT NULL,
                cpf VARCHAR(14) NOT NULL,
                registration VARCHAR(60) NOT NULL,
                email VARCHAR(180),
                phone VARCHAR(40),
                birth_date DATE,
                hire_date DATE NOT NULL,
                current_salary NUMERIC(15, 2) NOT NULL,
                contract_type VARCHAR(20) NOT NULL,
                pay_frequency VARCHAR(20) NOT NULL,
                estimated_monthly_units NUMERIC(10, 4) NOT NULL,
                contract_start_date DATE NOT NULL,
                contract_end_date DATE,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                termination_date DATE,
                termination_reason VARCHAR(500),
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT hr_employees_salary_check CHECK (current_salary > 0),
                CONSTRAINT hr_employees_estimated_units_check
                    CHECK (estimated_monthly_units > 0),
                CONSTRAINT hr_employees_contract_type_check
                    CHECK (contract_type IN ('CLT', 'TEMPORARY', 'PJ', 'FREELANCER')),
                CONSTRAINT hr_employees_pay_frequency_check
                    CHECK (pay_frequency IN ('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'DAILY', 'HOURLY')),
                CONSTRAINT hr_employees_contract_dates_check CHECK (
                    contract_end_date IS NULL OR contract_end_date >= contract_start_date
                ),
                CONSTRAINT hr_employees_temporary_end_date_check CHECK (
                    contract_type <> 'TEMPORARY' OR contract_end_date IS NOT NULL
                ),
                CONSTRAINT hr_employees_clt_end_date_check CHECK (
                    contract_type <> 'CLT' OR contract_end_date IS NULL
                ),
                CONSTRAINT hr_employees_status_check
                    CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'TERMINATED')),
                CONSTRAINT hr_employees_termination_check CHECK (
                    (status = 'TERMINATED' AND termination_date IS NOT NULL)
                    OR (status <> 'TERMINATED' AND termination_date IS NULL AND termination_reason IS NULL)
                )
            );

            CREATE INDEX hr_employees_organization_id_idx
                ON hr_employees (organization_id);
            CREATE INDEX hr_employees_organization_status_idx
                ON hr_employees (organization_id, status)
                WHERE deleted_at IS NULL;
            CREATE INDEX hr_employees_organization_department_idx
                ON hr_employees (organization_id, department_id)
                WHERE deleted_at IS NULL;
            CREATE INDEX hr_employees_organization_position_idx
                ON hr_employees (organization_id, position_id)
                WHERE deleted_at IS NULL;
            CREATE UNIQUE INDEX hr_employees_organization_cpf_unique
                ON hr_employees (organization_id, cpf)
                WHERE deleted_at IS NULL;
            CREATE UNIQUE INDEX hr_employees_organization_registration_unique
                ON hr_employees (organization_id, registration)
                WHERE deleted_at IS NULL;
            CREATE UNIQUE INDEX hr_employees_organization_user_unique
                ON hr_employees (organization_id, organization_user_id)
                WHERE organization_user_id IS NOT NULL AND deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS hr_employees;',
        )
    },
}
