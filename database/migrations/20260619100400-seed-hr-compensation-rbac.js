'use strict'

const permissions = [
    ['hr.compensation.read', 'Visualizar remuneracao do RH'],
    ['hr.compensation.manage', 'Gerenciar remuneracao do RH'],
]

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            INSERT INTO permissions (code, description)
            VALUES
                ('${permissions[0][0]}', '${permissions[0][1]}'),
                ('${permissions[1][0]}', '${permissions[1][1]}')
            ON CONFLICT (code) DO UPDATE
                SET description = EXCLUDED.description;

            INSERT INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM roles
            INNER JOIN permissions
                ON permissions.code IN ('hr.compensation.read', 'hr.compensation.manage')
            WHERE roles.organization_id IS NOT NULL
                AND roles.code IN ('ADMIN', 'HR')
            ON CONFLICT DO NOTHING;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DELETE FROM role_permissions
            USING permissions
            WHERE role_permissions.permission_id = permissions.id
                AND permissions.code IN ('hr.compensation.read', 'hr.compensation.manage');

            DELETE FROM permissions
            WHERE code IN ('hr.compensation.read', 'hr.compensation.manage');
        `)
    },
}
