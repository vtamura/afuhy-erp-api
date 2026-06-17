'use strict'

const permissions = [
    ['settings.organizations.read', 'Visualizar organizacoes'],
    ['settings.organizations.create', 'Criar organizacoes'],
    ['settings.members.read', 'Visualizar membros da organizacao'],
    ['settings.members.manage', 'Gerenciar membros da organizacao'],
    ['settings.users.read', 'Visualizar usuarios da organizacao'],
    ['settings.users.update', 'Editar usuarios da organizacao'],
    ['settings.users.delete', 'Excluir usuarios da organizacao'],
    ['settings.billing.read', 'Visualizar assinatura e planos'],
    ['settings.billing.manage', 'Gerenciar assinatura da organizacao'],
    ['hr.employees.read', 'Visualizar colaboradores do RH'],
    ['hr.employees.manage', 'Gerenciar colaboradores do RH'],
    ['financial.transactions.read', 'Visualizar transacoes financeiras'],
    ['financial.transactions.manage', 'Gerenciar transacoes financeiras'],
]

const roles = [
    ['ADMIN', 'Administrador'],
    ['HR', 'RH'],
    ['FINANCIAL', 'Financeiro'],
    ['VIEWER', 'Visualizador'],
]

const rolePermissions = {
    ADMIN: permissions.map(([code]) => code),
    HR: [
        'settings.organizations.read',
        'settings.members.read',
        'settings.members.manage',
        'settings.users.read',
        'hr.employees.read',
        'hr.employees.manage',
    ],
    FINANCIAL: [
        'settings.organizations.read',
        'settings.members.read',
        'settings.users.read',
        'financial.transactions.read',
        'financial.transactions.manage',
    ],
    VIEWER: [
        'settings.organizations.read',
        'settings.members.read',
        'settings.users.read',
    ],
}

function toSqlValues(rows) {
    return rows
        .map(
            ([first, second]) =>
                `('${first.replaceAll("'", "''")}', '${second.replaceAll("'", "''")}')`,
        )
        .join(',\n')
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const permissionValues = toSqlValues(permissions)
        const roleValues = toSqlValues(roles)
        const rolePermissionValues = Object.entries(rolePermissions)
            .flatMap(([roleCode, permissionCodes]) =>
                permissionCodes.map(
                    (permissionCode) => `('${roleCode}', '${permissionCode}')`,
                ),
            )
            .join(',\n')

        await queryInterface.sequelize.query(`
            INSERT INTO permissions (code, description)
            VALUES
                ${permissionValues}
            ON CONFLICT (code) DO NOTHING;

            INSERT INTO roles (organization_id, code, name, is_system)
            SELECT organizations.id, role_defaults.code, role_defaults.name, false
            FROM organizations
            CROSS JOIN (
                VALUES
                    ${roleValues}
            ) AS role_defaults(code, name)
            ON CONFLICT DO NOTHING;

            INSERT INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM roles
            INNER JOIN (
                VALUES
                    ${rolePermissionValues}
            ) AS role_permission_defaults(role_code, permission_code)
                ON role_permission_defaults.role_code = roles.code
            INNER JOIN permissions
                ON permissions.code = role_permission_defaults.permission_code
            WHERE roles.organization_id IS NOT NULL
            ON CONFLICT DO NOTHING;
        `)
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            DELETE FROM role_permissions
            USING roles, permissions
            WHERE role_permissions.role_id = roles.id
                AND role_permissions.permission_id = permissions.id
                AND roles.code IN (${roles.map(([code]) => `'${code}'`).join(', ')})
                AND permissions.code IN (${permissions.map(([code]) => `'${code}'`).join(', ')});

            DELETE FROM permissions
            WHERE code IN (${permissions.map(([code]) => `'${code}'`).join(', ')});
        `)
    },
}
