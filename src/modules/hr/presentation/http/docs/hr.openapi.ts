import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

const security = [{ accessTokenCookie: [] }]
const idParameter = {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
}
const errorResponse = {
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
    },
}
const operation = (input: {
    summary: string
    permission: string
    response: unknown
    parameters?: unknown[]
    request?: string
    created?: boolean
    noContent?: boolean
}) => ({
    tags: ['RH'],
    summary: input.summary,
    security,
    description: `Requer feature hr.basic e permissao ${input.permission}.`,
    parameters: input.parameters,
    requestBody: input.request
        ? {
              required: true,
              content: {
                  'application/json': {
                      schema: {
                          $ref: `#/components/schemas/${input.request}`,
                      },
                  },
              },
          }
        : undefined,
    responses: {
        [input.noContent ? 204 : input.created ? 201 : 200]: input.noContent
            ? { description: 'Operacao concluida' }
            : {
                  description: 'Sucesso',
                  content: {
                      'application/json': { schema: input.response },
                  },
              },
        400: { description: 'Dados invalidos', ...errorResponse },
        401: { description: 'Nao autenticado', ...errorResponse },
        403: { description: 'Acesso negado', ...errorResponse },
        404: { description: 'Nao encontrado', ...errorResponse },
        409: { description: 'Conflito de regra', ...errorResponse },
    },
})

const catalogPaths = (path: string, label: string) => ({
    [path]: {
        get: operation({
            summary: `Lista ${label}`,
            permission: 'hr.employees.read',
            response: {
                type: 'array',
                items: { $ref: '#/components/schemas/HrCatalog' },
            },
        }),
        post: operation({
            summary: `Cria ${label}`,
            permission: 'hr.employees.manage',
            request: 'HrCatalogInput',
            response: { $ref: '#/components/schemas/HrCatalog' },
            created: true,
        }),
    },
    [`${path}/{id}`]: {
        get: operation({
            summary: `Busca ${label}`,
            permission: 'hr.employees.read',
            parameters: [idParameter],
            response: { $ref: '#/components/schemas/HrCatalog' },
        }),
        patch: operation({
            summary: `Atualiza ${label}`,
            permission: 'hr.employees.manage',
            parameters: [idParameter],
            request: 'HrCatalogInput',
            response: { $ref: '#/components/schemas/HrCatalog' },
        }),
        delete: operation({
            summary: `Remove ${label}`,
            permission: 'hr.employees.manage',
            parameters: [idParameter],
            response: {},
            noContent: true,
        }),
    },
})

export const hrOpenApiDocument: OpenApiModuleDocument = {
    tags: [{ name: 'RH', description: 'Gestao basica de pessoas' }],
    schemas: {
        HrCatalogInput: {
            type: 'object',
            properties: {
                name: { type: 'string', maxLength: 150 },
                description: { type: 'string', nullable: true },
                status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            },
        },
        HrCatalog: {
            allOf: [
                { $ref: '#/components/schemas/HrCatalogInput' },
                {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        organizationId: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        deletedAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                        },
                    },
                },
            ],
        },
        EmployeeInput: {
            type: 'object',
            required: [
                'name',
                'cpf',
                'registration',
                'departmentId',
                'positionId',
                'hireDate',
                'initialSalary',
            ],
            properties: {
                organizationUserId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
                departmentId: { type: 'string', format: 'uuid' },
                positionId: { type: 'string', format: 'uuid' },
                name: { type: 'string', maxLength: 180 },
                cpf: { type: 'string', example: '12345678901' },
                registration: { type: 'string', maxLength: 60 },
                email: { type: 'string', format: 'email', nullable: true },
                phone: { type: 'string', nullable: true },
                birthDate: {
                    type: 'string',
                    format: 'date',
                    nullable: true,
                },
                hireDate: { type: 'string', format: 'date' },
                initialSalary: {
                    type: 'string',
                    pattern: '^\\d{1,13}(\\.\\d{1,2})?$',
                },
                notes: { type: 'string', nullable: true },
            },
        },
        Employee: {
            type: 'object',
            description: 'Resposta geral sem dados salariais.',
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                organizationUserId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
                department: { $ref: '#/components/schemas/HrCatalog' },
                position: { $ref: '#/components/schemas/HrCatalog' },
                name: { type: 'string' },
                cpf: { type: 'string' },
                registration: { type: 'string' },
                email: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true },
                birthDate: { type: 'string', format: 'date', nullable: true },
                hireDate: { type: 'string', format: 'date' },
                status: {
                    type: 'string',
                    enum: ['ACTIVE', 'ON_LEAVE', 'TERMINATED'],
                },
                terminationDate: {
                    type: 'string',
                    format: 'date',
                    nullable: true,
                },
                terminationReason: { type: 'string', nullable: true },
                notes: { type: 'string', nullable: true },
            },
        },
        AssignmentInput: {
            type: 'object',
            required: ['departmentId', 'positionId', 'effectiveDate'],
            properties: {
                departmentId: { type: 'string', format: 'uuid' },
                positionId: { type: 'string', format: 'uuid' },
                effectiveDate: { type: 'string', format: 'date' },
                reason: { type: 'string', nullable: true },
            },
        },
        Assignment: {
            allOf: [
                { $ref: '#/components/schemas/AssignmentInput' },
                {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        employeeId: { type: 'string', format: 'uuid' },
                        departmentName: { type: 'string' },
                        positionName: { type: 'string' },
                        createdBy: { type: 'string', format: 'uuid' },
                        creatorName: { type: 'string' },
                    },
                },
            ],
        },
        SalaryChangeInput: {
            type: 'object',
            required: ['salary', 'effectiveDate'],
            properties: {
                salary: {
                    type: 'string',
                    pattern: '^\\d{1,13}(\\.\\d{1,2})?$',
                },
                effectiveDate: { type: 'string', format: 'date' },
                reason: { type: 'string', nullable: true },
            },
        },
        SalaryChange: {
            allOf: [
                { $ref: '#/components/schemas/SalaryChangeInput' },
                {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        employeeId: { type: 'string', format: 'uuid' },
                        createdBy: { type: 'string', format: 'uuid' },
                        creatorName: { type: 'string' },
                    },
                },
            ],
        },
        HrSummary: {
            type: 'object',
            properties: {
                totalEmployees: { type: 'integer' },
                byStatus: { type: 'array', items: { type: 'object' } },
                byDepartment: { type: 'array', items: { type: 'object' } },
                byPosition: { type: 'array', items: { type: 'object' } },
                admissions: { type: 'integer' },
                terminations: { type: 'integer' },
                periodStart: { type: 'string', format: 'date' },
                periodEnd: { type: 'string', format: 'date' },
            },
        },
    },
    paths: {
        ...catalogPaths('/hr/departments', 'departamento'),
        ...catalogPaths('/hr/positions', 'cargo'),
        '/hr/employees': {
            get: operation({
                summary: 'Lista funcionarios com filtros e paginacao',
                permission: 'hr.employees.read',
                response: {
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Employee' },
                        },
                        pagination: { type: 'object' },
                    },
                },
            }),
            post: operation({
                summary: 'Admite funcionario',
                permission: 'hr.employees.manage',
                request: 'EmployeeInput',
                response: { $ref: '#/components/schemas/Employee' },
                created: true,
            }),
        },
        '/hr/employees/{id}': {
            get: operation({
                summary: 'Busca funcionario',
                permission: 'hr.employees.read',
                parameters: [idParameter],
                response: { $ref: '#/components/schemas/Employee' },
            }),
            patch: operation({
                summary: 'Atualiza ou desliga funcionario',
                permission: 'hr.employees.manage',
                parameters: [idParameter],
                request: 'EmployeeInput',
                response: { $ref: '#/components/schemas/Employee' },
            }),
            delete: operation({
                summary: 'Remove cadastro criado por engano',
                permission: 'hr.employees.manage',
                parameters: [idParameter],
                response: {},
                noContent: true,
            }),
        },
        '/hr/employees/{id}/assignments': {
            get: operation({
                summary: 'Lista historico funcional',
                permission: 'hr.employees.read',
                parameters: [idParameter],
                response: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Assignment' },
                },
            }),
            post: operation({
                summary: 'Registra mudanca funcional',
                permission: 'hr.employees.manage',
                parameters: [idParameter],
                request: 'AssignmentInput',
                response: { $ref: '#/components/schemas/Assignment' },
                created: true,
            }),
        },
        '/hr/employees/{id}/salary-changes': {
            get: operation({
                summary: 'Lista historico salarial',
                permission: 'hr.compensation.read',
                parameters: [idParameter],
                response: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SalaryChange' },
                },
            }),
            post: operation({
                summary: 'Registra mudanca salarial',
                permission: 'hr.compensation.manage',
                parameters: [idParameter],
                request: 'SalaryChangeInput',
                response: { $ref: '#/components/schemas/SalaryChange' },
                created: true,
            }),
        },
        '/hr/summary': {
            get: operation({
                summary: 'Resume quadro no mes informado ou atual',
                permission: 'hr.employees.read',
                response: { $ref: '#/components/schemas/HrSummary' },
            }),
        },
    },
}
