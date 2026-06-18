'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE task_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                task_id UUID NOT NULL REFERENCES tasks(id),
                author_user_id UUID NOT NULL REFERENCES users(id),
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE INDEX task_comments_organization_id_idx
                ON task_comments (organization_id);
            CREATE INDEX task_comments_task_created_at_idx
                ON task_comments (task_id, created_at);
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DROP TABLE IF EXISTS task_comments;',
        )
    },
}
