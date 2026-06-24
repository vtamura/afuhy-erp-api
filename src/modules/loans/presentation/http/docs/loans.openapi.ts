import type { OpenApiModuleDocument } from '../../../../../main/docs/openapi.types'

export const loansOpenApiDocument: OpenApiModuleDocument = {
    tags: [{ name: 'Loans', description: 'Emprestimos de itens do estoque' }],
    schemas: {
        LoanItem: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                variantId: { type: 'string', format: 'uuid' },
                productName: { type: 'string' },
                variantName: { type: 'string' },
                variantSku: { type: 'string' },
                quantityReleased: { type: 'string' },
                quantityReturned: { type: 'string' },
                quantityLost: { type: 'string' },
                quantityDamaged: { type: 'string' },
                pendingQuantity: { type: 'string' },
            },
        },
        Loan: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                borrowerType: { enum: ['CUSTOMER', 'EMPLOYEE'] },
                customerId: { type: 'string', format: 'uuid', nullable: true },
                employeeId: { type: 'string', format: 'uuid', nullable: true },
                status: {
                    enum: [
                        'DRAFT',
                        'RELEASED',
                        'PARTIALLY_RETURNED',
                        'COMPLETED',
                        'CANCELED',
                    ],
                },
                expectedReturnDate: { type: 'string', format: 'date' },
                isOverdue: { type: 'boolean' },
                items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LoanItem' },
                },
            },
        },
        LoanPayload: {
            type: 'object',
            required: ['borrowerType', 'expectedReturnDate', 'items'],
            properties: {
                borrowerType: { enum: ['CUSTOMER', 'EMPLOYEE'] },
                customerId: { type: 'string', format: 'uuid', nullable: true },
                employeeId: { type: 'string', format: 'uuid', nullable: true },
                expectedReturnDate: { type: 'string', format: 'date' },
                notes: { type: 'string', nullable: true },
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['variantId', 'quantity'],
                        properties: {
                            variantId: { type: 'string', format: 'uuid' },
                            quantity: { type: 'string', example: '1.000' },
                            notes: { type: 'string', nullable: true },
                        },
                    },
                },
            },
        },
    },
    paths: {
        '/loans': {
            get: {
                tags: ['Loans'],
                summary: 'Lista emprestimos',
                security: [{ accessTokenCookie: [] }],
                responses: { 200: { description: 'Lista paginada' } },
            },
            post: {
                tags: ['Loans'],
                summary: 'Cria emprestimo em rascunho',
                security: [{ accessTokenCookie: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoanPayload' },
                        },
                    },
                },
                responses: { 201: { description: 'Emprestimo criado' } },
            },
        },
        '/loans/{id}': {
            get: {
                tags: ['Loans'],
                summary: 'Detalha emprestimo',
                security: [{ accessTokenCookie: [] }],
                responses: { 200: { description: 'Emprestimo' } },
            },
            patch: {
                tags: ['Loans'],
                summary: 'Atualiza rascunho',
                security: [{ accessTokenCookie: [] }],
                responses: { 200: { description: 'Emprestimo atualizado' } },
            },
        },
        '/loans/{id}/release': {
            post: {
                tags: ['Loans'],
                summary: 'Libera emprestimo e movimenta estoque',
                security: [{ accessTokenCookie: [] }],
                responses: { 200: { description: 'Emprestimo liberado' } },
            },
        },
        '/loans/{id}/returns': {
            post: {
                tags: ['Loans'],
                summary: 'Registra devolucao parcial ou total',
                security: [{ accessTokenCookie: [] }],
                responses: { 201: { description: 'Devolucao registrada' } },
            },
        },
        '/loans/{id}/occurrences': {
            post: {
                tags: ['Loans'],
                summary: 'Registra perda ou dano',
                security: [{ accessTokenCookie: [] }],
                responses: { 201: { description: 'Ocorrencia registrada' } },
            },
        },
        '/loans/{id}/charges': {
            post: {
                tags: ['Loans'],
                summary: 'Cria cobranca financeira do emprestimo',
                security: [{ accessTokenCookie: [] }],
                responses: { 201: { description: 'Cobranca criada' } },
            },
        },
    },
}
