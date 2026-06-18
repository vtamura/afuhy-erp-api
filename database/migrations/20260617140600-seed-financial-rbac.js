'use strict'

const permissions = [
    ['financial.accounts.read', 'Visualizar contas financeiras'],
    ['financial.accounts.manage', 'Gerenciar contas financeiras'],
    ['financial.categories.read', 'Visualizar categorias financeiras'],
    ['financial.categories.manage', 'Gerenciar categorias financeiras'],
    ['financial.transactions.read', 'Visualizar lancamentos financeiros'],
    ['financial.transactions.manage', 'Gerenciar lancamentos financeiros'],
]

const rolePermissions = {
    ADMIN: permissions.map(([code]) => code),
    FINANCIAL: permissions.map(([code]) => code),
    VIEWER: [
        'financial.accounts.read',
        'financial.categories.read',
        'financial.transactions.read',
    ],
}

function quote(value) {
    return String(value).replaceAll("'", "''")
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const permissionValues = permissions
            .map(
                ([code, description]) =>
                    `('${quote(code)}', '${quote(description)}')`,
            )
            .join(',\n')
        const rolePermissionValues = Object.entries(rolePermissions)
            .flatMap(([roleCode, permissionCodes]) =>
                permissionCodes.map(
                    (permissionCode) =>
                        `('${quote(roleCode)}', '${quote(permissionCode)}')`,
                ),
            )
            .join(',\n')

        await queryInterface.sequelize.query(`
            INSERT INTO permissions (code, description)
            VALUES
                ${permissionValues}
            ON CONFLICT (code) DO UPDATE
                SET description = EXCLUDED.description;

            INSERT INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM (
                VALUES
                    ${rolePermissionValues}
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
        const newPermissionCodes = permissions
            .filter(([code]) => !code.startsWith('financial.transactions.'))
            .map(([code]) => `'${quote(code)}'`)
            .join(', ')

        await queryInterface.sequelize.query(`
            DELETE FROM role_permissions
            USING roles, permissions
            WHERE role_permissions.role_id = roles.id
                AND role_permissions.permission_id = permissions.id
                AND roles.code = 'VIEWER'
                AND roles.organization_id IS NOT NULL
                AND permissions.code = 'financial.transactions.read';

            DELETE FROM role_permissions
            USING permissions
            WHERE role_permissions.permission_id = permissions.id
                AND permissions.code IN (${newPermissionCodes});

            DELETE FROM permissions
            WHERE code IN (${newPermissionCodes});
        `)
    },
}
