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
                salary NUMERIC(15, 2) NOT NULL,
                effective_date DATE NOT NULL,
                reason VARCHAR(500),
                created_by UUID NOT NULL REFERENCES users(id),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT hr_salary_changes_salary_check CHECK (salary > 0)
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
