import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

export const exampleOpenApiDocument: OpenApiModuleDocument = {
    tags: [
        {
            name: 'Example',
            description: 'Modulo de referencia arquitetural.',
        },
        {
            name: 'Health',
            description: 'Status operacional da API.',
        },
    ],
    schemas: {
        Example: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
                id: {
                    type: 'string',
                    example: 'example-module',
                },
                name: {
                    type: 'string',
                    example: 'Example module',
                },
                description: {
                    type: 'string',
                    nullable: true,
                    example:
                        'Referencia inicial para novos modulos com domain, application, infrastructure e presentation.',
                },
            },
        },
        HealthResponse: {
            type: 'object',
            required: ['status', 'service', 'timestamp'],
            properties: {
                status: {
                    type: 'string',
                    example: 'ok',
                },
                service: {
                    type: 'string',
                    example: 'afuhy-api',
                },
                timestamp: {
                    type: 'string',
                    format: 'date-time',
                },
            },
        },
    },
    paths: {
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Verifica o status da API',
                responses: {
                    '200': {
                        description: 'API operacional.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/HealthResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/examples': {
            get: {
                tags: ['Example'],
                summary: 'Lista exemplos de referencia',
                responses: {
                    '200': {
                        description: 'Lista de exemplos.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Example',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}
