'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            CREATE TABLE audit_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id),
                request_id UUID,
                actor_type VARCHAR(20) NOT NULL,
                actor_user_id UUID REFERENCES users(id),
                action VARCHAR(40) NOT NULL,
                module VARCHAR(80) NOT NULL,
                entity_type VARCHAR(120) NOT NULL,
                entity_id VARCHAR(120),
                summary VARCHAR(500) NOT NULL,
                changes JSONB NOT NULL DEFAULT '{}'::jsonb,
                metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
                ip_address VARCHAR(80),
                user_agent TEXT,
                occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT audit_logs_actor_type_check CHECK (actor_type IN ('USER', 'SYSTEM', 'STRIPE')),
                CONSTRAINT audit_logs_action_check CHECK (
                    action IN (
                        'CREATE',
                        'UPDATE',
                        'DELETE',
                        'RESTORE',
                        'STATUS_CHANGE',
                        'LOGIN',
                        'LOGOUT',
                        'PERMISSION_CHANGE',
                        'WEBHOOK_RECEIVED',
                        'WEBHOOK_PROCESSED',
                        'READ_SENSITIVE'
                    )
                )
            );

            CREATE INDEX audit_logs_organization_occurred_idx
                ON audit_logs (organization_id, occurred_at DESC);

            CREATE INDEX audit_logs_actor_user_idx
                ON audit_logs (actor_user_id)
                WHERE actor_user_id IS NOT NULL;

            CREATE INDEX audit_logs_entity_idx
                ON audit_logs (organization_id, entity_type, entity_id);

            CREATE INDEX audit_logs_module_action_idx
                ON audit_logs (organization_id, module, action);

            INSERT INTO permissions (code, description)
            VALUES ('audit.logs.read', 'Visualizar logs de auditoria')
            ON CONFLICT (code) DO UPDATE
                SET description = EXCLUDED.description;

            INSERT INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM roles
            INNER JOIN permissions
                ON permissions.code = 'audit.logs.read'
            WHERE roles.organization_id IS NOT NULL
                AND roles.code = 'ADMIN'
            ON CONFLICT DO NOTHING;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DELETE FROM role_permissions
            USING roles, permissions
            WHERE role_permissions.role_id = roles.id
                AND role_permissions.permission_id = permissions.id
                AND permissions.code = 'audit.logs.read';

            DELETE FROM permissions
            WHERE code = 'audit.logs.read';

            DROP TABLE IF EXISTS audit_logs;
        `)
    },
}
