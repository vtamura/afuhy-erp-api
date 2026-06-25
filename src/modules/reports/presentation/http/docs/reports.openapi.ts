import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

const dashboardQuery = [
    {
        name: 'year',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 2000, maximum: 2100 },
    },
    {
        name: 'month',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 12 },
    },
]

const dashboardResponse = (schema: string) => ({
    200: {
        description: 'Dashboard operacional',
        content: {
            'application/json': {
                schema: { $ref: `#/components/schemas/${schema}` },
            },
        },
    },
})

const securedDashboard = (summary: string, schema: string) => ({
    tags: ['Reports'],
    summary,
    security: [{ accessTokenCookie: [] }],
    parameters: dashboardQuery,
    responses: dashboardResponse(schema),
})

export const reportsOpenApiDocument: OpenApiModuleDocument = {
    tags: [{ name: 'Reports', description: 'Dashboards operacionais' }],
    schemas: {
        ReportPeriod: {
            type: 'object',
            properties: {
                year: { type: 'integer' },
                month: { type: 'integer' },
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
            },
        },
        ReportsFinancial: {
            type: 'object',
            properties: {
                balances: {
                    type: 'object',
                    properties: {
                        current: { type: 'string' },
                        projected: { type: 'string' },
                    },
                },
                cashFlow: {
                    type: 'object',
                    properties: {
                        paidIncome: { type: 'string' },
                        paidExpense: { type: 'string' },
                        pendingIncome: { type: 'string' },
                        pendingExpense: { type: 'string' },
                        result: { type: 'string' },
                    },
                },
                monthlyFlow: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            year: { type: 'integer' },
                            month: { type: 'integer' },
                            income: { type: 'string' },
                            expense: { type: 'string' },
                            result: { type: 'string' },
                        },
                    },
                },
            },
        },
        ReportsInventory: {
            type: 'object',
            properties: {
                activeProducts: { type: 'integer' },
                activeSkus: { type: 'integer' },
                totalQuantity: { type: 'string' },
                totalValue: { type: 'string' },
                zeroStockCount: { type: 'integer' },
                lowStockCount: { type: 'integer' },
            },
        },
        ReportsHr: {
            type: 'object',
            properties: {
                totalEmployees: { type: 'integer' },
                admissions: { type: 'integer' },
                terminations: { type: 'integer' },
            },
        },
        ReportsLoans: {
            type: 'object',
            properties: {
                openLoans: { type: 'integer' },
                overdueLoans: { type: 'integer' },
                completedLoans: { type: 'integer' },
                pendingItemsQuantity: { type: 'string' },
            },
        },
        ReportsTasks: {
            type: 'object',
            properties: {
                openTasks: { type: 'integer' },
                overdueTasks: { type: 'integer' },
                urgentTasks: { type: 'integer' },
                completedTasks: { type: 'integer' },
            },
        },
        ReportsOverview: {
            type: 'object',
            properties: {
                period: { $ref: '#/components/schemas/ReportPeriod' },
                financial: { $ref: '#/components/schemas/ReportsFinancial' },
                inventory: { $ref: '#/components/schemas/ReportsInventory' },
                hr: { $ref: '#/components/schemas/ReportsHr' },
                loans: { $ref: '#/components/schemas/ReportsLoans' },
                tasks: { $ref: '#/components/schemas/ReportsTasks' },
                attention: { type: 'object' },
            },
        },
        ReportsFinancialDashboard: {
            type: 'object',
            properties: {
                period: { $ref: '#/components/schemas/ReportPeriod' },
                financial: { $ref: '#/components/schemas/ReportsFinancial' },
            },
        },
        ReportsInventoryDashboard: {
            type: 'object',
            properties: {
                period: { $ref: '#/components/schemas/ReportPeriod' },
                inventory: { $ref: '#/components/schemas/ReportsInventory' },
            },
        },
        ReportsHrDashboard: {
            type: 'object',
            properties: {
                period: { $ref: '#/components/schemas/ReportPeriod' },
                hr: { $ref: '#/components/schemas/ReportsHr' },
            },
        },
        ReportsLoansDashboard: {
            type: 'object',
            properties: {
                period: { $ref: '#/components/schemas/ReportPeriod' },
                loans: { $ref: '#/components/schemas/ReportsLoans' },
            },
        },
        ReportsTasksDashboard: {
            type: 'object',
            properties: {
                period: { $ref: '#/components/schemas/ReportPeriod' },
                tasks: { $ref: '#/components/schemas/ReportsTasks' },
            },
        },
    },
    paths: {
        '/reports/overview': {
            get: securedDashboard(
                'Dashboard operacional geral',
                'ReportsOverview',
            ),
        },
        '/reports/financial': {
            get: securedDashboard(
                'Dashboard financeiro em relatorios',
                'ReportsFinancialDashboard',
            ),
        },
        '/reports/inventory': {
            get: securedDashboard(
                'Dashboard de estoque em relatorios',
                'ReportsInventoryDashboard',
            ),
        },
        '/reports/hr': {
            get: securedDashboard(
                'Dashboard de RH em relatorios',
                'ReportsHrDashboard',
            ),
        },
        '/reports/loans': {
            get: securedDashboard(
                'Dashboard de emprestimos em relatorios',
                'ReportsLoansDashboard',
            ),
        },
        '/reports/tasks': {
            get: securedDashboard(
                'Dashboard de tarefas em relatorios',
                'ReportsTasksDashboard',
            ),
        },
    },
}
