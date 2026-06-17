'use strict'

const permissionCode = 'settings.members.manage'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            INSERT INTO permissions (code, description)
            VALUES ('${permissionCode}', 'Gerenciar membros da organizacao')
            ON CONFLICT (code) DO NOTHING;

            INSERT INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM roles
            INNER JOIN permissions
                ON permissions.code = '${permissionCode}'
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
                AND permissions.code = '${permissionCode}';

            DELETE FROM permissions
            WHERE code = '${permissionCode}';
        `)
    },
}
