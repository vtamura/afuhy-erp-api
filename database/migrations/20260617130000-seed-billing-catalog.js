'use strict'

const plans = [['BUSINESS', 'Afuhy ERP', 14990, 'BRL', 'MONTH', 5]]

const features = [
    ['registry.basic', 'Cadastros gerais basicos'],
    ['financial.basic', 'Financeiro basico'],
    ['hr.basic', 'RH basico'],
    ['inventory.basic', 'Estoque basico'],
    ['loans.basic', 'Emprestimos basicos'],
    ['tasks.basic', 'Tarefas e atividades basicas'],
    ['reports.basic', 'Relatorios basicos'],
    ['users.basic', 'Controle basico de usuarios'],
    ['permissions.advanced', 'Permissoes avancadas'],
    ['audit.logs', 'Auditoria de alteracoes'],
    ['reports.advanced', 'Relatorios avancados'],
    ['api.access', 'Acesso a API'],
    ['approvals.basic', 'Fluxos basicos de aprovacao'],
    ['exports.advanced', 'Exportacoes avancadas'],
    ['multi_company.advanced', 'Multiempresa avancado'],
    ['integrations.external', 'Integracoes externas'],
]

const businessFeatures = [
    'registry.basic',
    'financial.basic',
    'hr.basic',
    'inventory.basic',
    'loans.basic',
    'tasks.basic',
    'reports.basic',
    'users.basic',
    'permissions.advanced',
    'audit.logs',
    'reports.advanced',
    'api.access',
    'approvals.basic',
    'exports.advanced',
    'multi_company.advanced',
    'integrations.external',
]

const billingPermissions = [
    ['settings.billing.read', 'Visualizar assinatura e planos'],
    ['settings.billing.manage', 'Gerenciar assinatura da organizacao'],
]

function quote(value) {
    return String(value).replaceAll("'", "''")
}

function toTextValues(rows) {
    return rows
        .map(([first, second]) => `('${quote(first)}', '${quote(second)}')`)
        .join(',\n')
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const planValues = plans
            .map(
                ([code, name, priceCents, currency, interval, includedUsers]) =>
                    `('${code}', '${name}', ${priceCents}, '${currency}', '${interval}', ${includedUsers})`,
            )
            .join(',\n')
        const featureValues = toTextValues(features)
        const permissionValues = toTextValues(billingPermissions)
        const businessFeatureValues = businessFeatures
            .map((featureCode) => `('BUSINESS', '${featureCode}')`)
            .join(',\n')

        await queryInterface.sequelize.query(`
            INSERT INTO plans (
                code,
                name,
                price_cents,
                currency,
                billing_interval,
                included_users
            )
            VALUES
                ${planValues}
            ON CONFLICT (code) DO UPDATE
                SET name = EXCLUDED.name,
                    price_cents = EXCLUDED.price_cents,
                    currency = EXCLUDED.currency,
                    billing_interval = EXCLUDED.billing_interval,
                    included_users = EXCLUDED.included_users;

            INSERT INTO features (code, description)
            VALUES
                ${featureValues}
            ON CONFLICT (code) DO UPDATE
                SET description = EXCLUDED.description;

            INSERT INTO plan_features (plan_id, feature_id)
            SELECT plans.id, features.id
            FROM (
                VALUES
                    ${businessFeatureValues}
            ) AS plan_feature_defaults(plan_code, feature_code)
            INNER JOIN plans
                ON plans.code::text = plan_feature_defaults.plan_code
            INNER JOIN features
                ON features.code = plan_feature_defaults.feature_code
            ON CONFLICT DO NOTHING;

            INSERT INTO permissions (code, description)
            VALUES
                ${permissionValues}
            ON CONFLICT (code) DO UPDATE
                SET description = EXCLUDED.description;

            INSERT INTO role_permissions (role_id, permission_id)
            SELECT roles.id, permissions.id
            FROM roles
            INNER JOIN permissions
                ON permissions.code IN ('settings.billing.read', 'settings.billing.manage')
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
                AND permissions.code IN ('settings.billing.read', 'settings.billing.manage');

            DELETE FROM permissions
            WHERE code IN ('settings.billing.read', 'settings.billing.manage');

            DELETE FROM subscriptions
            USING plans
            WHERE subscriptions.plan_id = plans.id
                AND plans.code::text IN ('BUSINESS', 'STARTER', 'PROFESSIONAL');

            DELETE FROM plan_features
            USING features
            WHERE plan_features.feature_id = features.id
                AND features.code IN (${features.map(([code]) => `'${code}'`).join(', ')});

            DELETE FROM features
            WHERE code IN (${features.map(([code]) => `'${code}'`).join(', ')});

            DELETE FROM plans
            WHERE code::text IN ('BUSINESS', 'STARTER', 'PROFESSIONAL');
        `)
    },
}
