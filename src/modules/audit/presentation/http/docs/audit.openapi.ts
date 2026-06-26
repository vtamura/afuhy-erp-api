import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

const errorResponse = {
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
    },
}

export const auditOpenApiDocument: OpenApiModuleDocument = {
    tags: [
        {
            name: 'Audit',
            description: 'Logs de auditoria e trilhas de alteracao.',
        },
    ],
    schemas: {
        AuditLog: {
            type: 'object',
            required: [
                'id',
                'organizationId',
                'requestId',
                'actorType',
                'actorUserId',
                'action',
                'module',
                'entityType',
                'entityId',
                'summary',
                'changes',
                'metadata',
                'ipAddress',
                'userAgent',
                'occurredAt',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                requestId: { type: 'string', format: 'uuid', nullable: true },
                actorType: {
                    type: 'string',
                    enum: ['USER', 'SYSTEM', 'STRIPE'],
                },
                actorUserId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
                action: {
                    type: 'string',
                    enum: [
                        'CREATE',
                        'UPDATE',
                        'DELETE',
                        'RESTORE',
                        'STATUS_CHANGE',
                        'LOGIN',
                        'LOGOUT',
                        'PERMISSION_CHANGE',
                        'WEBHOOK_RECEIVED',
                        'WEBHOOK_PROCESSED',
                        'READ_SENSITIVE',
                    ],
                },
                module: { type: 'string', example: 'billing' },
                entityType: { type: 'string', example: 'subscription' },
                entityId: { type: 'string', nullable: true },
                summary: {
                    type: 'string',
                    example: 'Assinatura manual definida',
                },
                changes: { type: 'object', additionalProperties: true },
                metadata: { type: 'object', additionalProperties: true },
                ipAddress: { type: 'string', nullable: true },
                userAgent: { type: 'string', nullable: true },
                occurredAt: { type: 'string', format: 'date-time' },
            },
        },
        AuditLogList: {
            type: 'object',
            required: ['items', 'page', 'pageSize', 'total'],
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AuditLog' },
                },
                page: { type: 'integer', example: 1 },
                pageSize: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 42 },
            },
        },
    },
    paths: {
        '/audit/logs': {
            get: {
                tags: ['Audit'],
                summary: 'Lista logs de auditoria',
                description:
                    'Exige feature audit.logs e permissao audit.logs.read.',
                security: [{ accessTokenCookie: [] }],
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer' } },
                    {
                        name: 'pageSize',
                        in: 'query',
                        schema: { type: 'integer', maximum: 100 },
                    },
                    { name: 'module', in: 'query', schema: { type: 'string' } },
                    { name: 'action', in: 'query', schema: { type: 'string' } },
                    {
                        name: 'actorType',
                        in: 'query',
                        schema: { type: 'string' },
                    },
                    {
                        name: 'actorUserId',
                        in: 'query',
                        schema: { type: 'string', format: 'uuid' },
                    },
                    {
                        name: 'entityType',
                        in: 'query',
                        schema: { type: 'string' },
                    },
                    {
                        name: 'entityId',
                        in: 'query',
                        schema: { type: 'string' },
                    },
                    {
                        name: 'from',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                    },
                    {
                        name: 'to',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                    },
                    { name: 'search', in: 'query', schema: { type: 'string' } },
                ],
                responses: {
                    '200': {
                        description: 'Lista paginada de logs.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AuditLogList',
                                },
                            },
                        },
                    },
                    '401': { description: 'Nao autorizado.', ...errorResponse },
                    '403': {
                        description: 'Operacao proibida.',
                        ...errorResponse,
                    },
                },
            },
        },
        '/audit/logs/{id}': {
            get: {
                tags: ['Audit'],
                summary: 'Detalha log de auditoria',
                security: [{ accessTokenCookie: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Log de auditoria.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AuditLog',
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
                        description: 'Log nao encontrado.',
                        ...errorResponse,
                    },
                },
            },
        },
    },
}
