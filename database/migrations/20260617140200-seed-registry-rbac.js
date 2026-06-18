'use strict'

const permissions = [
    ['registry.customers.read', 'Visualizar clientes'],
    ['registry.customers.manage', 'Gerenciar clientes'],
    ['registry.suppliers.read', 'Visualizar fornecedores'],
    ['registry.suppliers.manage', 'Gerenciar fornecedores'],
]

const rolePermissions = {
    ADMIN: permissions.map(([code]) => code),
    FINANCIAL: permissions.map(([code]) => code),
    VIEWER: ['registry.customers.read', 'registry.suppliers.read'],
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
        const permissionCodes = permissions
            .map(([code]) => `'${quote(code)}'`)
            .join(', ')

        await queryInterface.sequelize.query(`
            DELETE FROM role_permissions
            USING permissions
            WHERE role_permissions.permission_id = permissions.id
                AND permissions.code IN (${permissionCodes});

            DELETE FROM permissions
            WHERE code IN (${permissionCodes});
        `)
    },
}
