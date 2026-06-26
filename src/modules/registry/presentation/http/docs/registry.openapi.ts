import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

const accessSecurity = [{ accessTokenCookie: [] }]

const errorResponse = {
    content: {
        'application/json': {
            schema: {
                $ref: '#/components/schemas/ErrorResponse',
            },
        },
    },
}

const recordSchema = {
    type: 'object',
    required: [
        'id',
        'organizationId',
        'name',
        'document',
        'documentType',
        'email',
        'phone',
        'notes',
        'status',
        'createdAt',
        'updatedAt',
        'deletedAt',
    ],
    properties: {
        id: { type: 'string', format: 'uuid' },
        organizationId: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Cliente Exemplo' },
        document: { type: 'string', nullable: true, example: '12345678000190' },
        documentType: {
            type: 'string',
            nullable: true,
            enum: ['CPF', 'CNPJ', 'OTHER'],
            example: 'CNPJ',
        },
        email: {
            type: 'string',
            format: 'email',
            nullable: true,
            example: 'contato@empresa.com.br',
        },
        phone: { type: 'string', nullable: true, example: '+5511999999999' },
        notes: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        deletedAt: { type: 'string', format: 'date-time', nullable: true },
    },
}

const inputSchema = {
    type: 'object',
    required: ['name'],
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 150 },
        document: { type: 'string', maxLength: 32, nullable: true },
        documentType: {
            type: 'string',
            enum: ['CPF', 'CNPJ', 'OTHER'],
            nullable: true,
        },
        email: { type: 'string', format: 'email', nullable: true },
        phone: { type: 'string', maxLength: 40, nullable: true },
        notes: { type: 'string', nullable: true },
        status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE'],
            default: 'ACTIVE',
        },
    },
}

function collectionPath(resourceName: 'customers' | 'suppliers') {
    const singular = resourceName === 'customers' ? 'Customer' : 'Supplier'
    const readPermission =
        resourceName === 'customers'
            ? 'registry.customers.read'
            : 'registry.suppliers.read'
    const managePermission =
        resourceName === 'customers'
            ? 'registry.customers.manage'
            : 'registry.suppliers.manage'

    return {
        get: {
            tags: ['Registry'],
            summary: `Lista ${resourceName === 'customers' ? 'clientes' : 'fornecedores'}`,
            description: `Exige feature registry.basic e permissao ${readPermission}.`,
            security: accessSecurity,
            responses: {
                '200': {
                    description: 'Lista de cadastros ativos no tenant.',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: `#/components/schemas/${singular}`,
                                },
                            },
                        },
                    },
                },
                '401': { description: 'Nao autenticado.', ...errorResponse },
                '403': { description: 'Sem acesso.', ...errorResponse },
            },
        },
        post: {
            tags: ['Registry'],
            summary: `Cria ${resourceName === 'customers' ? 'cliente' : 'fornecedor'}`,
            description: `Exige feature registry.basic e permissao ${managePermission}.`,
            security: accessSecurity,
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: `#/components/schemas/Create${singular}Input`,
                        },
                    },
                },
            },
            responses: {
                '201': {
                    description: 'Cadastro criado.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: `#/components/schemas/${singular}`,
                            },
                        },
                    },
                },
                '400': { description: 'Entrada invalida.', ...errorResponse },
                '401': { description: 'Nao autenticado.', ...errorResponse },
                '403': { description: 'Sem acesso.', ...errorResponse },
                '409': {
                    description: 'Documento ja cadastrado.',
                    ...errorResponse,
                },
            },
        },
    }
}

function itemPath(resourceName: 'customers' | 'suppliers') {
    const singular = resourceName === 'customers' ? 'Customer' : 'Supplier'
    const readPermission =
        resourceName === 'customers'
            ? 'registry.customers.read'
            : 'registry.suppliers.read'
    const managePermission =
        resourceName === 'customers'
            ? 'registry.customers.manage'
            : 'registry.suppliers.manage'
    const parameters = [
        {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
        },
    ]

    return {
        get: {
            tags: ['Registry'],
            summary: `Busca ${resourceName === 'customers' ? 'cliente' : 'fornecedor'}`,
            description: `Exige feature registry.basic e permissao ${readPermission}.`,
            security: accessSecurity,
            parameters,
            responses: {
                '200': {
                    description: 'Cadastro encontrado.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: `#/components/schemas/${singular}`,
                            },
                        },
                    },
                },
                '401': { description: 'Nao autenticado.', ...errorResponse },
                '403': { description: 'Sem acesso.', ...errorResponse },
                '404': {
                    description: 'Cadastro nao encontrado.',
                    ...errorResponse,
                },
            },
        },
        patch: {
            tags: ['Registry'],
            summary: `Edita ${resourceName === 'customers' ? 'cliente' : 'fornecedor'}`,
            description: `Exige feature registry.basic e permissao ${managePermission}.`,
            security: accessSecurity,
            parameters,
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: `#/components/schemas/Update${singular}Input`,
                        },
                    },
                },
            },
            responses: {
                '200': {
                    description: 'Cadastro atualizado.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: `#/components/schemas/${singular}`,
                            },
                        },
                    },
                },
                '400': { description: 'Entrada invalida.', ...errorResponse },
                '401': { description: 'Nao autenticado.', ...errorResponse },
                '403': { description: 'Sem acesso.', ...errorResponse },
                '404': {
                    description: 'Cadastro nao encontrado.',
                    ...errorResponse,
                },
                '409': {
                    description: 'Documento ja cadastrado.',
                    ...errorResponse,
                },
            },
        },
        delete: {
            tags: ['Registry'],
            summary: `Remove ${resourceName === 'customers' ? 'cliente' : 'fornecedor'}`,
            description: `Faz delecao logica. Exige feature registry.basic e permissao ${managePermission}.`,
            security: accessSecurity,
            parameters,
            responses: {
                '204': { description: 'Cadastro removido.' },
                '401': { description: 'Nao autenticado.', ...errorResponse },
                '403': { description: 'Sem acesso.', ...errorResponse },
                '404': {
                    description: 'Cadastro nao encontrado.',
                    ...errorResponse,
                },
            },
        },
    }
}

export const registryOpenApiDocument: OpenApiModuleDocument = {
    tags: [
        {
            name: 'Registry',
            description: 'Cadastros gerais tenant-scoped.',
        },
    ],
    schemas: {
        Customer: recordSchema,
        Supplier: recordSchema,
        CreateCustomerInput: inputSchema,
        UpdateCustomerInput: inputSchema,
        CreateSupplierInput: inputSchema,
        UpdateSupplierInput: inputSchema,
    },
    paths: {
        '/registry/customers': collectionPath('customers'),
        '/registry/customers/{id}': itemPath('customers'),
        '/registry/suppliers': collectionPath('suppliers'),
        '/registry/suppliers/{id}': itemPath('suppliers'),
    },
}
