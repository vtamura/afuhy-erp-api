import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

const errorResponse = {
    content: {
        'application/json': {
            schema: {
                $ref: '#/components/schemas/ErrorResponse',
            },
        },
    },
}

export const billingOpenApiDocument: OpenApiModuleDocument = {
    tags: [
        {
            name: 'Billing',
            description: 'Planos, assinatura da organizacao e feature gates.',
        },
    ],
    schemas: {
        Feature: {
            type: 'object',
            required: ['id', 'code', 'description'],
            properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string', example: 'financial.basic' },
                description: {
                    type: 'string',
                    nullable: true,
                    example: 'Financeiro basico',
                },
            },
        },
        Plan: {
            type: 'object',
            required: [
                'id',
                'code',
                'name',
                'priceCents',
                'currency',
                'billingInterval',
                'maxUsers',
                'createdAt',
                'features',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                code: {
                    type: 'string',
                    enum: ['STARTER', 'PROFESSIONAL'],
                    example: 'STARTER',
                },
                name: { type: 'string', example: 'Starter' },
                priceCents: { type: 'integer', example: 9990 },
                currency: { type: 'string', example: 'BRL' },
                billingInterval: {
                    type: 'string',
                    enum: ['MONTH', 'YEAR'],
                    example: 'MONTH',
                },
                maxUsers: { type: 'integer', example: 5 },
                createdAt: { type: 'string', format: 'date-time' },
                features: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Feature' },
                },
            },
        },
        Subscription: {
            type: 'object',
            required: [
                'id',
                'organizationId',
                'plan',
                'source',
                'status',
                'startsAt',
                'endsAt',
                'currentPeriodStart',
                'currentPeriodEnd',
                'cancelAtPeriodEnd',
                'createdAt',
                'updatedAt',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                plan: { $ref: '#/components/schemas/Plan' },
                source: {
                    type: 'string',
                    enum: ['MANUAL', 'STRIPE'],
                    example: 'STRIPE',
                },
                status: {
                    type: 'string',
                    enum: [
                        'TRIALING',
                        'ACTIVE',
                        'PAST_DUE',
                        'CANCELED',
                        'EXPIRED',
                    ],
                    example: 'ACTIVE',
                },
                startsAt: { type: 'string', format: 'date-time' },
                endsAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
                currentPeriodStart: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
                currentPeriodEnd: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
                cancelAtPeriodEnd: {
                    type: 'boolean',
                    example: false,
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
        SetOrganizationSubscriptionInput: {
            type: 'object',
            required: ['planCode', 'status'],
            properties: {
                planCode: {
                    type: 'string',
                    enum: ['STARTER', 'PROFESSIONAL'],
                    example: 'STARTER',
                },
                status: {
                    type: 'string',
                    enum: [
                        'TRIALING',
                        'ACTIVE',
                        'PAST_DUE',
                        'CANCELED',
                        'EXPIRED',
                    ],
                    example: 'ACTIVE',
                },
                startsAt: { type: 'string', format: 'date-time' },
                endsAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
            },
        },
        CreateStripeCheckoutSessionInput: {
            type: 'object',
            required: ['planCode'],
            properties: {
                planCode: {
                    type: 'string',
                    enum: ['STARTER', 'PROFESSIONAL'],
                    example: 'PROFESSIONAL',
                },
            },
        },
        StripeSessionResponse: {
            type: 'object',
            required: ['url'],
            properties: {
                url: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://checkout.stripe.com/c/pay/cs_test_...',
                },
            },
        },
    },
    paths: {
        '/billing/plans': {
            get: {
                tags: ['Billing'],
                summary: 'Lista planos disponiveis',
                responses: {
                    '200': {
                        description: 'Lista de planos com features e limites.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Plan',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/billing/subscription': {
            get: {
                tags: ['Billing'],
                summary: 'Consulta assinatura corrente da organizacao',
                description:
                    'Exige tenant selecionado e permissao settings.billing.read.',
                security: [{ accessTokenCookie: [] }],
                responses: {
                    '200': {
                        description: 'Assinatura corrente.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Subscription',
                                },
                            },
                        },
                    },
                    '401': { description: 'Nao autorizado.', ...errorResponse },
                    '403': {
                        description: 'Operacao proibida.',
                        ...errorResponse,
                    },
                    '404': {
                        description: 'Assinatura nao encontrada.',
                        ...errorResponse,
                    },
                },
            },
        },
        '/billing/organizations/{id}/subscription': {
            put: {
                tags: ['Billing'],
                summary: 'Define assinatura da organizacao',
                description:
                    'Endpoint interno temporario. Exige tenant selecionado correspondente a rota e permissao settings.billing.manage.',
                security: [{ accessTokenCookie: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/SetOrganizationSubscriptionInput',
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Assinatura definida.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Subscription',
                                },
                            },
                        },
                    },
                    '401': { description: 'Nao autorizado.', ...errorResponse },
                    '403': {
                        description: 'Operacao proibida.',
                        ...errorResponse,
                    },
                    '404': {
                        description: 'Plano nao encontrado.',
                        ...errorResponse,
                    },
                },
            },
        },
        '/billing/stripe/checkout-session': {
            post: {
                tags: ['Billing'],
                summary: 'Cria sessao Stripe Checkout',
                description:
                    'Exige tenant selecionado e permissao settings.billing.manage. Usa Price IDs configurados por ambiente.',
                security: [{ accessTokenCookie: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateStripeCheckoutSessionInput',
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'URL do Stripe Checkout.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/StripeSessionResponse',
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Configuracao Stripe ausente ou invalida.',
                        ...errorResponse,
                    },
                    '401': { description: 'Nao autorizado.', ...errorResponse },
                    '403': {
                        description: 'Operacao proibida.',
                        ...errorResponse,
                    },
                    '404': {
                        description: 'Plano ou organizacao nao encontrado.',
                        ...errorResponse,
                    },
                },
            },
        },
        '/billing/stripe/customer-portal': {
            post: {
                tags: ['Billing'],
                summary: 'Cria sessao Stripe Customer Portal',
                description:
                    'Exige tenant selecionado, permissao settings.billing.manage e customer Stripe ja vinculado.',
                security: [{ accessTokenCookie: [] }],
                responses: {
                    '200': {
                        description: 'URL do Customer Portal.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/StripeSessionResponse',
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Customer Stripe ausente.',
                        ...errorResponse,
                    },
                    '401': { description: 'Nao autorizado.', ...errorResponse },
                    '403': {
                        description: 'Operacao proibida.',
                        ...errorResponse,
                    },
                },
            },
        },
        '/billing/stripe/webhook': {
            post: {
                tags: ['Billing'],
                summary: 'Recebe webhooks Stripe',
                description:
                    'Endpoint publico que exige assinatura Stripe valida e corpo bruto application/json.',
                responses: {
                    '200': {
                        description: 'Evento recebido.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['received'],
                                    properties: {
                                        received: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Assinatura ausente ou invalida.',
                        ...errorResponse,
                    },
                },
            },
        },
    },
}
