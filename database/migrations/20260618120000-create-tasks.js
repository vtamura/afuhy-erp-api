'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                title VARCHAR(200) NOT NULL,
                description TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'BACKLOG',
                priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
                assignee_organization_user_id UUID REFERENCES organization_users(id),
                created_by UUID NOT NULL REFERENCES users(id),
                due_at TIMESTAMPTZ,
                position INTEGER NOT NULL DEFAULT 0,
                completed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                deleted_at TIMESTAMPTZ,
                CONSTRAINT tasks_status_check
                    CHECK (status IN ('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE')),
                CONSTRAINT tasks_priority_check
                    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
                CONSTRAINT tasks_position_check CHECK (position >= 0)
            );

            CREATE INDEX tasks_organization_id_idx
                ON tasks (organization_id);
            CREATE INDEX tasks_organization_status_position_idx
                ON tasks (organization_id, status, position)
                WHERE deleted_at IS NULL;
            CREATE INDEX tasks_organization_assignee_idx
                ON tasks (organization_id, assignee_organization_user_id)
                WHERE deleted_at IS NULL;
            CREATE INDEX tasks_organization_priority_idx
                ON tasks (organization_id, priority)
                WHERE deleted_at IS NULL;
            CREATE INDEX tasks_organization_due_at_idx
                ON tasks (organization_id, due_at)
                WHERE due_at IS NOT NULL AND deleted_at IS NULL;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS tasks;')
    },
}
