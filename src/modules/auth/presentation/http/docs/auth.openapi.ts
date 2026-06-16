import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

const unauthorizedResponse = {
    description: 'Nao autorizado.',
    content: {
        'application/json': {
            schema: {
                $ref: '#/components/schemas/ErrorResponse',
            },
        },
    },
}

const forbiddenResponse = {
    description: 'Operacao proibida.',
    content: {
        'application/json': {
            schema: {
                $ref: '#/components/schemas/ErrorResponse',
            },
        },
    },
}

const notFoundResponse = {
    description: 'Usuario nao encontrado.',
    content: {
        'application/json': {
            schema: {
                $ref: '#/components/schemas/ErrorResponse',
            },
        },
    },
}

export const authOpenApiDocument: OpenApiModuleDocument = {
    tags: [
        {
            name: 'Auth',
            description: 'Sessao, login, refresh token e logout.',
        },
        {
            name: 'Users',
            description: 'Criacao e listagem de usuarios.',
        },
        {
            name: 'Organizations',
            description: 'Organizacoes, membros e contexto multiempresa.',
        },
    ],
    schemas: {
        ErrorResponse: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
                code: {
                    type: 'string',
                    example: 'UNAUTHORIZED',
                },
                message: {
                    type: 'string',
                    example: 'Token invalido',
                },
                details: {
                    nullable: true,
                },
            },
        },
        User: {
            type: 'object',
            required: [
                'id',
                'name',
                'email',
                'status',
                'createdAt',
                'updatedAt',
                'deletedAt',
            ],
            properties: {
                id: {
                    type: 'string',
                    format: 'uuid',
                },
                name: {
                    type: 'string',
                    example: 'Maria Silva',
                },
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'maria@afuhy.com.br',
                },
                status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
                    example: 'ACTIVE',
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time',
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time',
                },
                deletedAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
            },
        },
        Organization: {
            type: 'object',
            required: [
                'id',
                'name',
                'document',
                'documentType',
                'status',
                'createdAt',
                'updatedAt',
            ],
            properties: {
                id: {
                    type: 'string',
                    format: 'uuid',
                },
                name: {
                    type: 'string',
                    example: 'Afuhy Tecnologia',
                },
                document: {
                    type: 'string',
                    example: '12345678000190',
                },
                documentType: {
                    type: 'string',
                    enum: ['CPF', 'CNPJ'],
                    example: 'CNPJ',
                },
                status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
                    example: 'ACTIVE',
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time',
                },
                updatedAt: {
                    type: 'string',
                    format: 'date-time',
                },
            },
        },
        OrganizationMember: {
            type: 'object',
            required: [
                'organizationUserId',
                'userId',
                'name',
                'email',
                'status',
                'roles',
                'createdAt',
            ],
            properties: {
                organizationUserId: {
                    type: 'string',
                    format: 'uuid',
                },
                userId: {
                    type: 'string',
                    format: 'uuid',
                },
                name: {
                    type: 'string',
                    example: 'Maria Silva',
                },
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'maria@afuhy.com.br',
                },
                status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE'],
                    example: 'ACTIVE',
                },
                roles: {
                    type: 'array',
                    items: {
                        $ref: '#/components/schemas/Role',
                    },
                },
                createdAt: {
                    type: 'string',
                    format: 'date-time',
                },
            },
        },
        Permission: {
            type: 'object',
            required: ['code'],
            properties: {
                code: {
                    type: 'string',
                    example: 'settings.users.read',
                },
                description: {
                    type: 'string',
                    nullable: true,
                    example: 'Visualizar usuarios da organizacao',
                },
            },
        },
        Role: {
            type: 'object',
            required: ['id', 'name', 'code', 'isSystem'],
            properties: {
                id: {
                    type: 'string',
                    format: 'uuid',
                },
                name: {
                    type: 'string',
                    example: 'Administrador',
                },
                code: {
                    type: 'string',
                    enum: ['ADMIN', 'HR', 'FINANCIAL', 'VIEWER'],
                    example: 'ADMIN',
                },
                isSystem: {
                    type: 'boolean',
                    example: false,
                },
            },
        },
        UserRole: {
            type: 'object',
            required: ['organizationUserId', 'role'],
            properties: {
                organizationUserId: {
                    type: 'string',
                    format: 'uuid',
                },
                role: {
                    $ref: '#/components/schemas/Role',
                },
            },
        },
        Session: {
            type: 'object',
            required: ['id', 'organizationId', 'expiresAt'],
            properties: {
                id: {
                    type: 'string',
                    format: 'uuid',
                },
                organizationId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
                expiresAt: {
                    type: 'string',
                    format: 'date-time',
                },
            },
        },
        AuthResponse: {
            type: 'object',
            required: ['user', 'session'],
            properties: {
                user: {
                    $ref: '#/components/schemas/User',
                },
                session: {
                    $ref: '#/components/schemas/Session',
                },
                organizations: {
                    type: 'array',
                    items: {
                        $ref: '#/components/schemas/Organization',
                    },
                },
                tokens: {
                    type: 'object',
                    description:
                        'Retornado apenas em desenvolvimento; em producao os tokens ficam somente em cookies httpOnly.',
                    properties: {
                        accessToken: {
                            type: 'string',
                        },
                        refreshToken: {
                            type: 'string',
                        },
                    },
                },
            },
        },
        CreateUserInput: {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 150,
                    example: 'Maria Silva',
                },
                email: {
                    type: 'string',
                    format: 'email',
                    maxLength: 180,
                    example: 'maria@afuhy.com.br',
                },
                password: {
                    type: 'string',
                    minLength: 8,
                    format: 'password',
                    example: 'password123',
                },
            },
        },
        CreateOrganizationInput: {
            type: 'object',
            required: ['name', 'document', 'documentType'],
            properties: {
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 150,
                    example: 'Afuhy Tecnologia',
                },
                document: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 20,
                    example: '12345678000190',
                },
                documentType: {
                    type: 'string',
                    enum: ['CPF', 'CNPJ'],
                    example: 'CNPJ',
                },
            },
        },
        SelectOrganizationInput: {
            type: 'object',
            required: ['organizationId'],
            properties: {
                organizationId: {
                    type: 'string',
                    format: 'uuid',
                },
            },
        },
        AddOrganizationMemberInput: {
            type: 'object',
            required: ['email', 'roleCodes'],
            properties: {
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'membro@afuhy.com.br',
                },
                roleCodes: {
                    type: 'array',
                    minItems: 1,
                    items: {
                        type: 'string',
                        enum: ['ADMIN', 'HR', 'FINANCIAL', 'VIEWER'],
                    },
                    example: ['VIEWER'],
                },
            },
        },
        UpdateMemberRolesInput: {
            type: 'object',
            required: ['roleCodes'],
            properties: {
                roleCodes: {
                    type: 'array',
                    minItems: 1,
                    items: {
                        type: 'string',
                        enum: ['ADMIN', 'HR', 'FINANCIAL', 'VIEWER'],
                    },
                    example: ['HR'],
                },
            },
        },
        UpdateUserInput: {
            type: 'object',
            required: ['name', 'email', 'status'],
            properties: {
                name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 150,
                    example: 'Maria Silva',
                },
                email: {
                    type: 'string',
                    format: 'email',
                    maxLength: 180,
                    example: 'maria@afuhy.com.br',
                },
                status: {
                    type: 'string',
                    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
                    example: 'ACTIVE',
                },
            },
        },
        LoginInput: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: {
                    type: 'string',
                    format: 'email',
                    example: 'maria@afuhy.com.br',
                },
                password: {
                    type: 'string',
                    format: 'password',
                    example: 'password123',
                },
            },
        },
    },
    paths: {
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Realiza login',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/LoginInput',
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description:
                            'Login realizado. Define cookies httpOnly de access e refresh token.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AuthResponse',
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                },
            },
        },
        '/auth/refresh': {
            post: {
                tags: ['Auth'],
                summary: 'Renova a sessao via refresh token',
                security: [
                    {
                        refreshTokenCookie: [],
                    },
                ],
                responses: {
                    '200': {
                        description:
                            'Sessao renovada. Rotaciona refresh token e atualiza cookies.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AuthResponse',
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                },
            },
        },
        '/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Encerra a sessao atual',
                security: [
                    {
                        refreshTokenCookie: [],
                    },
                ],
                responses: {
                    '204': {
                        description:
                            'Sessao revogada quando possivel e cookies removidos.',
                    },
                },
            },
        },
        '/auth/select-organization': {
            post: {
                tags: ['Auth'],
                summary: 'Seleciona a organizacao da sessao atual',
                description:
                    'Valida o vinculo ativo do usuario com a organizacao, atualiza a sessao e rotaciona os cookies de access e refresh token.',
                security: [
                    {
                        refreshTokenCookie: [],
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/SelectOrganizationInput',
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Organizacao selecionada.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AuthResponse',
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                    '403': forbiddenResponse,
                    '404': notFoundResponse,
                },
            },
        },
        '/organizations': {
            post: {
                tags: ['Organizations'],
                summary: 'Cria uma organizacao',
                description:
                    'Cria a organizacao, vincula o usuario autenticado, cria roles padrao e atribui a role ADMIN inicial. Exige apenas usuario autenticado.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateOrganizationInput',
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Organizacao criada.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Organization',
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                    '409': {
                        description: 'Documento ja cadastrado.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
            get: {
                tags: ['Organizations'],
                summary: 'Lista organizacoes do usuario autenticado',
                description:
                    'Nao exige organizacao selecionada; lista organizacoes ativas vinculadas ao usuario autenticado.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                responses: {
                    '200': {
                        description: 'Lista de organizacoes ativas vinculadas.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Organization',
                                    },
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                },
            },
        },
        '/organizations/{id}/members': {
            get: {
                tags: ['Organizations'],
                summary: 'Lista membros ativos de uma organizacao',
                description:
                    'Exige organizacao selecionada correspondente a rota, vinculo ativo e permissao settings.members.read.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Lista de membros ativos.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/OrganizationMember',
                                    },
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                    '403': forbiddenResponse,
                    '404': notFoundResponse,
                },
            },
            post: {
                tags: ['Organizations'],
                summary: 'Adiciona membro a uma organizacao',
                description:
                    'Adiciona um usuario global existente ou reativa um vinculo inativo. Exige permissao settings.members.manage.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AddOrganizationMemberInput',
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Membro adicionado.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/OrganizationMember',
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                    '403': forbiddenResponse,
                    '404': notFoundResponse,
                    '409': {
                        description: 'Usuario ja e membro ativo.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/organizations/{id}/members/{organizationUserId}/roles': {
            put: {
                tags: ['Organizations'],
                summary: 'Atualiza roles de um membro',
                description:
                    'Substitui o conjunto completo de roles do membro. Exige permissao settings.members.manage e preserva ao menos um ADMIN ativo.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                    {
                        name: 'organizationUserId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UpdateMemberRolesInput',
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Roles atualizadas.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/OrganizationMember',
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                    '403': forbiddenResponse,
                    '404': notFoundResponse,
                },
            },
        },
        '/organizations/{id}/members/{organizationUserId}': {
            delete: {
                tags: ['Organizations'],
                summary: 'Remove membro de uma organizacao',
                description:
                    'Desativa o vinculo do membro com a organizacao. Exige permissao settings.members.manage e preserva ao menos um ADMIN ativo.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                    {
                        name: 'organizationUserId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                ],
                responses: {
                    '204': {
                        description: 'Membro removido da organizacao.',
                    },
                    '401': unauthorizedResponse,
                    '403': forbiddenResponse,
                    '404': notFoundResponse,
                },
            },
        },
        '/users': {
            post: {
                tags: ['Users'],
                summary: 'Cria um usuario',
                description:
                    'Endpoint aberto temporariamente durante a fase inicial do modulo de autenticacao.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateUserInput',
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Usuario criado.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/User',
                                },
                            },
                        },
                    },
                    '409': {
                        description: 'E-mail ja cadastrado.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
            get: {
                tags: ['Users'],
                summary: 'Lista usuarios',
                description:
                    'Lista apenas usuarios nao deletados vinculados a organizacao selecionada. Exige permissao settings.users.read.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                responses: {
                    '200': {
                        description: 'Lista de usuarios.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/User',
                                    },
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                },
            },
        },
        '/users/{id}': {
            patch: {
                tags: ['Users'],
                summary: 'Edita um usuario',
                description:
                    'Edita apenas usuarios vinculados a organizacao selecionada. Exige permissao settings.users.update.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UpdateUserInput',
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Usuario atualizado.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/User',
                                },
                            },
                        },
                    },
                    '401': unauthorizedResponse,
                    '404': notFoundResponse,
                    '409': {
                        description: 'E-mail ja cadastrado.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse',
                                },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ['Users'],
                summary: 'Deleta logicamente um usuario',
                description:
                    'Preenche deletedAt, revoga sessoes ativas do usuario deletado e bloqueia autoexclusao. Exige permissao settings.users.delete.',
                security: [
                    {
                        accessTokenCookie: [],
                    },
                ],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                ],
                responses: {
                    '204': {
                        description: 'Usuario deletado logicamente.',
                    },
                    '401': unauthorizedResponse,
                    '403': forbiddenResponse,
                    '404': notFoundResponse,
                },
            },
        },
    },
}
