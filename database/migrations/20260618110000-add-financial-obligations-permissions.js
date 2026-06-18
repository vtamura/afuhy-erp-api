'use strict'

const permissions = [
    ['financial.payables.read', 'Visualizar contas a pagar'],
    ['financial.payables.manage', 'Gerenciar contas a pagar'],
    ['financial.receivables.read', 'Visualizar contas a receber'],
    ['financial.receivables.manage', 'Gerenciar contas a receber'],
]

const rolePermissions = {
    ADMIN: permissions.map(([code]) => code),
    FINANCIAL: permissions.map(([code]) => code),
    VIEWER: ['financial.payables.read', 'financial.receivables.read'],
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const permissionValues = permissions
            .map(([code, description]) => `('${code}', '${description}')`)
            .join(',\n')
        const rolePermissionValues = Object.entries(rolePermissions)
            .flatMap(([roleCode, permissionCodes]) =>
                permissionCodes.map(
                    (permissionCode) => `('${roleCode}', '${permissionCode}')`,
                ),
            )
            .join(',\n')

        await queryInterface.sequelize.query(`
            INSERT INTO permissions (code, description)
            VALUES ${permissionValues}
            ON CONFLICT (code) DO UPDATE
                SET description = EXCLUDED.description;

            INSERT INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM (
                VALUES ${rolePermissionValues}
            ) AS defaults(role_code, permission_code)
            INNER JOIN roles
                ON roles.code = defaults.role_code
                AND roles.organization_id IS NOT NULL
            INNER JOIN permissions
                ON permissions.code = defaults.permission_code
            ON CONFLICT DO NOTHING;
        `)
    },

    async down(queryInterface) {
        const codes = permissions.map(([code]) => `'${code}'`).join(', ')
        await queryInterface.sequelize.query(`
            DELETE FROM role_permissions
            USING permissions
            WHERE role_permissions.permission_id = permissions.id
                AND permissions.code IN (${codes});

            DELETE FROM permissions
            WHERE code IN (${codes});
        `)
    },
}
