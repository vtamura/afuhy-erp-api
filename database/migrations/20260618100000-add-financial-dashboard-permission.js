'use strict'

const permissionCode = 'financial.dashboard.read'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            INSERT INTO permissions (code, description)
            VALUES ('${permissionCode}', 'Visualizar dashboard financeiro')
            ON CONFLICT (code) DO UPDATE
                SET description = EXCLUDED.description;

            INSERT INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM roles
            INNER JOIN permissions
                ON permissions.code = '${permissionCode}'
            WHERE roles.organization_id IS NOT NULL
                AND roles.code IN ('ADMIN', 'FINANCIAL', 'VIEWER')
            ON CONFLICT DO NOTHING;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DELETE FROM role_permissions
            USING permissions
            WHERE role_permissions.permission_id = permissions.id
                AND permissions.code = '${permissionCode}';

            DELETE FROM permissions
            WHERE code = '${permissionCode}';
        `)
    },
}
