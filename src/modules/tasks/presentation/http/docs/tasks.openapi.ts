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
const taskInput = {
    type: 'object',
    properties: {
        title: { type: 'string', maxLength: 200 },
        description: { type: 'string', nullable: true },
        priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        },
        assigneeOrganizationUserId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
        },
        dueAt: { type: 'string', format: 'date-time', nullable: true },
    },
}

function operation(input: {
    summary: string
    permission: string
    requestSchema?: string
    responseSchema?: unknown
    parameters?: unknown[]
    created?: boolean
    noContent?: boolean
    notFound?: boolean
}) {
    const status = input.noContent ? '204' : input.created ? '201' : '200'
    const responses: Record<string, unknown> = {
        [status]: input.noContent
            ? { description: 'Operacao concluida.' }
            : {
                  description: 'Operacao concluida.',
                  content: {
                      'application/json': { schema: input.responseSchema },
                  },
              },
        '400': { description: 'Entrada invalida.', ...errorResponse },
        '401': { description: 'Nao autenticado.', ...errorResponse },
        '403': { description: 'Sem feature ou permissao.', ...errorResponse },
    }
    if (input.notFound) {
        responses['404'] = {
            description: 'Tarefa nao encontrada.',
            ...errorResponse,
        }
    }
    return {
        tags: ['Tasks'],
        summary: input.summary,
        description: `Exige feature tasks.basic e permissao ${input.permission}.`,
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

export const tasksOpenApiDocument: OpenApiModuleDocument = {
    tags: [
        {
            name: 'Tasks',
            description: 'Tarefas, quadro Kanban e comentarios.',
        },
    ],
    schemas: {
        TaskUser: {
            type: 'object',
            required: ['userId', 'name', 'email'],
            properties: {
                userId: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
            },
        },
        TaskAssignee: {
            allOf: [
                { $ref: '#/components/schemas/TaskUser' },
                {
                    type: 'object',
                    required: ['organizationUserId'],
                    properties: {
                        organizationUserId: {
                            type: 'string',
                            format: 'uuid',
                        },
                    },
                },
            ],
        },
        Task: {
            type: 'object',
            required: [
                'id',
                'organizationId',
                'title',
                'status',
                'priority',
                'position',
                'isOverdue',
                'creator',
                'createdAt',
                'updatedAt',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                ...taskInput.properties,
                status: {
                    type: 'string',
                    enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'],
                },
                assignee: {
                    allOf: [{ $ref: '#/components/schemas/TaskAssignee' }],
                    nullable: true,
                },
                createdBy: { type: 'string', format: 'uuid' },
                creator: { $ref: '#/components/schemas/TaskUser' },
                position: { type: 'integer', minimum: 0 },
                isOverdue: { type: 'boolean' },
                completedAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                deletedAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
            },
        },
        CreateTaskInput: {
            ...taskInput,
            properties: {
                ...taskInput.properties,
                status: {
                    type: 'string',
                    enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'],
                    default: 'BACKLOG',
                },
            },
            required: ['title'],
        },
        UpdateTaskInput: taskInput,
        MoveTaskInput: {
            type: 'object',
            required: ['status', 'position'],
            properties: {
                status: {
                    type: 'string',
                    enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'],
                },
                position: { type: 'integer', minimum: 0 },
            },
        },
        TaskComment: {
            type: 'object',
            required: [
                'id',
                'organizationId',
                'taskId',
                'authorUserId',
                'author',
                'content',
                'createdAt',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                taskId: { type: 'string', format: 'uuid' },
                authorUserId: { type: 'string', format: 'uuid' },
                author: { $ref: '#/components/schemas/TaskUser' },
                content: { type: 'string', maxLength: 5000 },
                createdAt: { type: 'string', format: 'date-time' },
            },
        },
        CreateTaskCommentInput: {
            type: 'object',
            required: ['content'],
            properties: {
                content: { type: 'string', minLength: 1, maxLength: 5000 },
            },
        },
        TaskPage: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Task' },
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
            },
        },
        TaskBoard: {
            type: 'object',
            properties: {
                columns: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string',
                                enum: [
                                    'BACKLOG',
                                    'TODO',
                                    'IN_PROGRESS',
                                    'DONE',
                                ],
                            },
                            items: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/Task',
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    paths: {
        '/tasks': {
            get: {
                ...operation({
                    summary: 'Lista tarefas com filtros e paginacao',
                    permission: 'tasks.tasks.read',
                    responseSchema: {
                        $ref: '#/components/schemas/TaskPage',
                    },
                }),
                parameters: [
                    {
                        name: 'status',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'],
                        },
                    },
                    {
                        name: 'priority',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                        },
                    },
                    {
                        name: 'assigneeOrganizationUserId',
                        in: 'query',
                        schema: { type: 'string', format: 'uuid' },
                    },
                    {
                        name: 'dueFrom',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                    },
                    {
                        name: 'dueTo',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                    },
                    {
                        name: 'overdue',
                        in: 'query',
                        schema: { type: 'boolean' },
                    },
                    {
                        name: 'search',
                        in: 'query',
                        schema: { type: 'string' },
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
                summary: 'Cria tarefa',
                permission: 'tasks.tasks.manage',
                requestSchema: 'CreateTaskInput',
                responseSchema: { $ref: '#/components/schemas/Task' },
                created: true,
            }),
        },
        '/tasks/board': {
            get: operation({
                summary: 'Lista quadro Kanban',
                permission: 'tasks.tasks.read',
                responseSchema: { $ref: '#/components/schemas/TaskBoard' },
            }),
        },
        '/tasks/{id}': {
            get: operation({
                summary: 'Busca tarefa',
                permission: 'tasks.tasks.read',
                parameters: [idParameter],
                responseSchema: { $ref: '#/components/schemas/Task' },
                notFound: true,
            }),
            patch: operation({
                summary: 'Atualiza tarefa',
                permission: 'tasks.tasks.manage',
                parameters: [idParameter],
                requestSchema: 'UpdateTaskInput',
                responseSchema: { $ref: '#/components/schemas/Task' },
                notFound: true,
            }),
            delete: operation({
                summary: 'Remove tarefa logicamente',
                permission: 'tasks.tasks.manage',
                parameters: [idParameter],
                noContent: true,
                notFound: true,
            }),
        },
        '/tasks/{id}/move': {
            post: operation({
                summary: 'Move e reordena tarefa no Kanban',
                permission: 'tasks.tasks.manage',
                parameters: [idParameter],
                requestSchema: 'MoveTaskInput',
                responseSchema: { $ref: '#/components/schemas/Task' },
                notFound: true,
            }),
        },
        '/tasks/{id}/comments': {
            get: operation({
                summary: 'Lista comentarios da tarefa',
                permission: 'tasks.tasks.read',
                parameters: [idParameter],
                responseSchema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TaskComment' },
                },
                notFound: true,
            }),
            post: operation({
                summary: 'Adiciona comentario a tarefa',
                permission: 'tasks.tasks.manage',
                parameters: [idParameter],
                requestSchema: 'CreateTaskCommentInput',
                responseSchema: {
                    $ref: '#/components/schemas/TaskComment',
                },
                created: true,
                notFound: true,
            }),
        },
    },
}
