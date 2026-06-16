export const AUTH_PERMISSIONS = {
    ORGANIZATIONS_READ: 'settings.organizations.read',
    ORGANIZATIONS_CREATE: 'settings.organizations.create',
    MEMBERS_READ: 'settings.members.read',
    MEMBERS_MANAGE: 'settings.members.manage',
    USERS_READ: 'settings.users.read',
    USERS_UPDATE: 'settings.users.update',
    USERS_DELETE: 'settings.users.delete',
    HR_EMPLOYEES_READ: 'hr.employees.read',
    HR_EMPLOYEES_MANAGE: 'hr.employees.manage',
    FINANCIAL_TRANSACTIONS_READ: 'financial.transactions.read',
    FINANCIAL_TRANSACTIONS_MANAGE: 'financial.transactions.manage',
} as const

export type AuthPermissionCode =
    (typeof AUTH_PERMISSIONS)[keyof typeof AUTH_PERMISSIONS]

export const DEFAULT_ORGANIZATION_ROLES = [
    {
        code: 'ADMIN',
        name: 'Administrador',
        permissions: Object.values(AUTH_PERMISSIONS),
    },
    {
        code: 'HR',
        name: 'RH',
        permissions: [
            AUTH_PERMISSIONS.ORGANIZATIONS_READ,
            AUTH_PERMISSIONS.MEMBERS_READ,
            AUTH_PERMISSIONS.MEMBERS_MANAGE,
            AUTH_PERMISSIONS.USERS_READ,
            AUTH_PERMISSIONS.HR_EMPLOYEES_READ,
            AUTH_PERMISSIONS.HR_EMPLOYEES_MANAGE,
        ],
    },
    {
        code: 'FINANCIAL',
        name: 'Financeiro',
        permissions: [
            AUTH_PERMISSIONS.ORGANIZATIONS_READ,
            AUTH_PERMISSIONS.MEMBERS_READ,
            AUTH_PERMISSIONS.USERS_READ,
            AUTH_PERMISSIONS.FINANCIAL_TRANSACTIONS_READ,
            AUTH_PERMISSIONS.FINANCIAL_TRANSACTIONS_MANAGE,
        ],
    },
    {
        code: 'VIEWER',
        name: 'Visualizador',
        permissions: [
            AUTH_PERMISSIONS.ORGANIZATIONS_READ,
            AUTH_PERMISSIONS.MEMBERS_READ,
            AUTH_PERMISSIONS.USERS_READ,
        ],
    },
] as const
