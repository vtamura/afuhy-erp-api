import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

const security = [{ accessTokenCookie: [] }]
const errorResponse = {
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
    },
}
const idParameter = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
}
const money = {
    type: 'string',
    pattern: '^-?\\d{1,13}(\\.\\d{1,2})?$',
    example: '1500.00',
}
const timestampProperties = {
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    deletedAt: { type: 'string', format: 'date-time', nullable: true },
}

const accountInput = {
    type: 'object',
    properties: {
        name: { type: 'string', maxLength: 150 },
        type: { type: 'string', enum: ['CASH', 'BANK', 'DIGITAL_WALLET'] },
        initialBalance: money,
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
    },
}
const categoryInput = {
    type: 'object',
    properties: {
        name: { type: 'string', maxLength: 150 },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
    },
}
const transactionInput = {
    type: 'object',
    properties: {
        accountId: { type: 'string', format: 'uuid' },
        categoryId: { type: 'string', format: 'uuid' },
        customerId: { type: 'string', format: 'uuid', nullable: true },
        supplierId: { type: 'string', format: 'uuid', nullable: true },
        description: { type: 'string', maxLength: 255 },
        notes: { type: 'string', nullable: true },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
        amount: { ...money, pattern: '^\\d{1,13}(\\.\\d{1,2})?$' },
        transactionDate: { type: 'string', format: 'date' },
        dueDate: { type: 'string', format: 'date', nullable: true },
    },
}

function crudPaths(input: {
    pathName: string
    label: string
    schema: string
    createSchema: string
    updateSchema: string
    readPermission: string
    managePermission: string
}) {
    const base = `/financial/${input.pathName}`
    return {
        [base]: {
            get: operation({
                summary: `Lista ${input.label}`,
                permission: input.readPermission,
                responseSchema: {
                    type: 'array',
                    items: { $ref: `#/components/schemas/${input.schema}` },
                },
            }),
            post: operation({
                summary: `Cria ${input.label}`,
                permission: input.managePermission,
                requestSchema: input.createSchema,
                responseSchema: {
                    $ref: `#/components/schemas/${input.schema}`,
                },
                created: true,
            }),
        },
        [`${base}/{id}`]: {
            get: operation({
                summary: `Busca ${input.label}`,
                permission: input.readPermission,
                parameters: [idParameter],
                responseSchema: {
                    $ref: `#/components/schemas/${input.schema}`,
                },
                notFound: true,
            }),
            patch: operation({
                summary: `Atualiza ${input.label}`,
                permission: input.managePermission,
                parameters: [idParameter],
                requestSchema: input.updateSchema,
                responseSchema: {
                    $ref: `#/components/schemas/${input.schema}`,
                },
                notFound: true,
                conflict: true,
            }),
            delete: operation({
                summary: `Remove ${input.label}`,
                permission: input.managePermission,
                parameters: [idParameter],
                noContent: true,
                notFound: true,
                conflict: true,
            }),
        },
    }
}

function operation(input: {
    summary: string
    permission: string
    parameters?: unknown[]
    requestSchema?: string
    responseSchema?: unknown
    created?: boolean
    noContent?: boolean
    notFound?: boolean
    conflict?: boolean
}) {
    const responses: Record<string, unknown> = {
        [input.noContent ? '204' : input.created ? '201' : '200']: input.noContent
            ? { description: 'Operacao concluida.' }
            : {
                  description: 'Operacao concluida.',
                  content: {
                      'application/json': { schema: input.responseSchema },
                  },
              },
        '400': { description: 'Entrada invalida.', ...errorResponse },
        '401': { description: 'Nao autenticado.', ...errorResponse },
        '403': {
            description: 'Sem feature ou permissao.',
            ...errorResponse,
        },
    }
    if (input.notFound) {
        responses['404'] = { description: 'Recurso nao encontrado.', ...errorResponse }
    }
    if (input.conflict) {
        responses['409'] = { description: 'Conflito de estado.', ...errorResponse }
    }

    return {
        tags: ['Financial'],
        summary: input.summary,
        description: `Exige feature financial.basic e permissao ${input.permission}.`,
        security,
        parameters: input.parameters,
        requestBody: input.requestSchema
            ? {
                  required: true,
                  content: {
                      'application/json': {
                          schema: {
                              $ref: `#/components/schemas/${input.requestSchema}`,
                          },
                      },
                  },
              }
            : undefined,
        responses,
    }
}

const transactionPaths = {
    '/financial/transactions': {
        get: {
            ...operation({
                summary: 'Lista lancamentos financeiros',
                permission: 'financial.transactions.read',
                responseSchema: {
                    $ref: '#/components/schemas/FinancialTransactionPage',
                },
            }),
            parameters: [
                ...[
                    'accountId',
                    'categoryId',
                    'customerId',
                    'supplierId',
                ].map((name) => ({
                    name,
                    in: 'query',
                    schema: { type: 'string', format: 'uuid' },
                })),
                {
                    name: 'type',
                    in: 'query',
                    schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                },
                {
                    name: 'status',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['PENDING', 'PAID', 'CANCELED'],
                    },
                },
                {
                    name: 'startDate',
                    in: 'query',
                    schema: { type: 'string', format: 'date' },
                },
                {
                    name: 'endDate',
                    in: 'query',
                    schema: { type: 'string', format: 'date' },
                },
                {
                    name: 'page',
                    in: 'query',
                    schema: { type: 'integer', minimum: 1, default: 1 },
                },
                {
                    name: 'pageSize',
                    in: 'query',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 20,
                    },
                },
            ],
        },
        post: operation({
            summary: 'Cria lancamento financeiro pendente',
            permission: 'financial.transactions.manage',
            requestSchema: 'CreateFinancialTransactionInput',
            responseSchema: {
                $ref: '#/components/schemas/FinancialTransaction',
            },
            created: true,
        }),
    },
    '/financial/transactions/{id}': {
        get: operation({
            summary: 'Busca lancamento financeiro',
            permission: 'financial.transactions.read',
            parameters: [idParameter],
            responseSchema: {
                $ref: '#/components/schemas/FinancialTransaction',
            },
            notFound: true,
        }),
        patch: operation({
            summary: 'Atualiza lancamento pendente',
            permission: 'financial.transactions.manage',
            parameters: [idParameter],
            requestSchema: 'UpdateFinancialTransactionInput',
            responseSchema: {
                $ref: '#/components/schemas/FinancialTransaction',
            },
            notFound: true,
            conflict: true,
        }),
        delete: operation({
            summary: 'Remove lancamento pendente ou cancelado',
            permission: 'financial.transactions.manage',
            parameters: [idParameter],
            noContent: true,
            notFound: true,
            conflict: true,
        }),
    },
    '/financial/transactions/{id}/pay': {
        post: operation({
            summary: 'Marca lancamento como pago',
            permission: 'financial.transactions.manage',
            parameters: [idParameter],
            responseSchema: {
                $ref: '#/components/schemas/FinancialTransaction',
            },
            notFound: true,
            conflict: true,
        }),
    },
    '/financial/transactions/{id}/cancel': {
        post: operation({
            summary: 'Cancela lancamento',
            permission: 'financial.transactions.manage',
            parameters: [idParameter],
            responseSchema: {
                $ref: '#/components/schemas/FinancialTransaction',
            },
            notFound: true,
            conflict: true,
        }),
    },
}

const dashboardPath = {
    '/financial/dashboard': {
        get: {
            ...operation({
                summary: 'Consulta dashboard financeiro',
                permission: 'financial.dashboard.read',
                responseSchema: {
                    $ref: '#/components/schemas/FinancialDashboard',
                },
            }),
            parameters: [
                {
                    name: 'year',
                    in: 'query',
                    schema: {
                        type: 'integer',
                        minimum: 2000,
                        maximum: 2100,
                    },
                },
                {
                    name: 'month',
                    in: 'query',
                    schema: { type: 'integer', minimum: 1, maximum: 12 },
                },
            ],
        },
    },
}

export const financialOpenApiDocument: OpenApiModuleDocument = {
    tags: [
        {
            name: 'Financial',
            description: 'Contas, categorias e lancamentos financeiros.',
        },
    ],
    schemas: {
        FinancialAccount: {
            type: 'object',
            required: [
                'id',
                'organizationId',
                'name',
                'type',
                'initialBalance',
                'currentBalance',
                'projectedBalance',
                'status',
                'createdAt',
                'updatedAt',
                'deletedAt',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                ...accountInput.properties,
                currentBalance: money,
                projectedBalance: money,
                ...timestampProperties,
            },
        },
        CreateFinancialAccountInput: {
            ...accountInput,
            required: ['name', 'type'],
        },
        UpdateFinancialAccountInput: accountInput,
        FinancialCategory: {
            type: 'object',
            required: [
                'id',
                'organizationId',
                'name',
                'type',
                'status',
                'createdAt',
                'updatedAt',
                'deletedAt',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                ...categoryInput.properties,
                ...timestampProperties,
            },
        },
        CreateFinancialCategoryInput: {
            ...categoryInput,
            required: ['name', 'type'],
        },
        UpdateFinancialCategoryInput: categoryInput,
        FinancialTransaction: {
            type: 'object',
            required: [
                'id',
                'organizationId',
                'accountId',
                'categoryId',
                'description',
                'type',
                'amount',
                'transactionDate',
                'status',
                'createdBy',
                'createdAt',
                'updatedAt',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                ...transactionInput.properties,
                status: {
                    type: 'string',
                    enum: ['PENDING', 'PAID', 'CANCELED'],
                },
                paidAt: { type: 'string', format: 'date-time', nullable: true },
                canceledAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
                createdBy: { type: 'string', format: 'uuid' },
                ...timestampProperties,
            },
        },
        CreateFinancialTransactionInput: {
            ...transactionInput,
            required: [
                'accountId',
                'categoryId',
                'description',
                'type',
                'amount',
                'transactionDate',
            ],
        },
        UpdateFinancialTransactionInput: transactionInput,
        FinancialTransactionSummary: {
            type: 'object',
            properties: {
                paidIncome: money,
                paidExpense: money,
                pendingIncome: money,
                pendingExpense: money,
            },
        },
        FinancialTransactionPage: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: {
                        $ref: '#/components/schemas/FinancialTransaction',
                    },
                },
                pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer' },
                        pageSize: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                    },
                },
                summary: {
                    $ref: '#/components/schemas/FinancialTransactionSummary',
                },
            },
        },
        FinancialDashboardCategory: {
            type: 'object',
            required: ['categoryId', 'name', 'amount', 'percentage'],
            properties: {
                categoryId: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                amount: money,
                percentage: {
                    type: 'string',
                    pattern: '^\\d{1,3}(\\.\\d{2})$',
                    example: '45.50',
                },
            },
        },
        FinancialDashboardAccount: {
            allOf: [{ $ref: '#/components/schemas/FinancialAccount' }],
        },
        FinancialDashboardDueGroup: {
            type: 'object',
            required: ['count', 'income', 'expense', 'items'],
            properties: {
                count: { type: 'integer' },
                income: money,
                expense: money,
                items: {
                    type: 'array',
                    maxItems: 5,
                    items: {
                        $ref: '#/components/schemas/FinancialTransaction',
                    },
                },
            },
        },
        FinancialDashboard: {
            type: 'object',
            required: [
                'period',
                'balances',
                'cashFlow',
                'accounts',
                'monthlyFlow',
                'categories',
                'overdue',
                'upcoming',
            ],
            properties: {
                period: {
                    type: 'object',
                    properties: {
                        year: { type: 'integer' },
                        month: { type: 'integer' },
                        startDate: { type: 'string', format: 'date' },
                        endDate: { type: 'string', format: 'date' },
                    },
                },
                balances: {
                    type: 'object',
                    properties: {
                        current: money,
                        projected: money,
                    },
                },
                cashFlow: {
                    type: 'object',
                    properties: {
                        paidIncome: money,
                        paidExpense: money,
                        result: money,
                        pendingIncome: money,
                        pendingExpense: money,
                    },
                },
                accounts: {
                    type: 'array',
                    items: {
                        $ref: '#/components/schemas/FinancialDashboardAccount',
                    },
                },
                monthlyFlow: {
                    type: 'array',
                    minItems: 12,
                    maxItems: 12,
                    items: {
                        type: 'object',
                        properties: {
                            year: { type: 'integer' },
                            month: { type: 'integer' },
                            income: money,
                            expense: money,
                            result: money,
                        },
                    },
                },
                categories: {
                    type: 'object',
                    properties: {
                        income: {
                            type: 'array',
                            maxItems: 5,
                            items: {
                                $ref: '#/components/schemas/FinancialDashboardCategory',
                            },
                        },
                        expense: {
                            type: 'array',
                            maxItems: 5,
                            items: {
                                $ref: '#/components/schemas/FinancialDashboardCategory',
                            },
                        },
                    },
                },
                overdue: {
                    $ref: '#/components/schemas/FinancialDashboardDueGroup',
                },
                upcoming: {
                    $ref: '#/components/schemas/FinancialDashboardDueGroup',
                },
            },
        },
    },
    paths: {
        ...dashboardPath,
        ...crudPaths({
            pathName: 'accounts',
            label: 'contas financeiras',
            schema: 'FinancialAccount',
            createSchema: 'CreateFinancialAccountInput',
            updateSchema: 'UpdateFinancialAccountInput',
            readPermission: 'financial.accounts.read',
            managePermission: 'financial.accounts.manage',
        }),
        ...crudPaths({
            pathName: 'categories',
            label: 'categorias financeiras',
            schema: 'FinancialCategory',
            createSchema: 'CreateFinancialCategoryInput',
            updateSchema: 'UpdateFinancialCategoryInput',
            readPermission: 'financial.categories.read',
            managePermission: 'financial.categories.manage',
        }),
        ...transactionPaths,
    },
}
