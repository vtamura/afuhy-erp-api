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
const variantIdParameter = {
    name: 'variantId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
}
const money = { type: 'string', pattern: '^\\d+(\\.\\d{2})$', example: '10.00' }
const quantity = {
    type: 'string',
    pattern: '^\\d+(\\.\\d{3})$',
    example: '10.000',
}
const variantInput = {
    type: 'object',
    properties: {
        name: { type: 'string', maxLength: 150 },
        sku: { type: 'string', maxLength: 100 },
        barcode: { type: 'string', maxLength: 100, nullable: true },
        salePrice: money,
        minimumQuantity: quantity,
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
    },
}
const productInput = {
    type: 'object',
    properties: {
        name: { type: 'string', maxLength: 180 },
        description: { type: 'string', nullable: true },
        unit: {
            type: 'string',
            enum: ['UN', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'CX'],
        },
        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
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
    conflict?: boolean
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
    if (input.notFound)
        responses['404'] = {
            description: 'Recurso nao encontrado.',
            ...errorResponse,
        }
    if (input.conflict)
        responses['409'] = {
            description: 'Conflito de estoque ou historico.',
            ...errorResponse,
        }
    return {
        tags: ['Inventory'],
        summary: input.summary,
        description: `Exige feature inventory.basic e permissao ${input.permission}.`,
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

export const inventoryOpenApiDocument: OpenApiModuleDocument = {
    tags: [
        {
            name: 'Inventory',
            description: 'Produtos, variacoes e movimentacoes de estoque.',
        },
    ],
    schemas: {
        InventoryVariant: {
            type: 'object',
            required: [
                'id',
                'organizationId',
                'productId',
                'name',
                'sku',
                'salePrice',
                'averageCost',
                'currentQuantity',
                'minimumQuantity',
                'inventoryValue',
                'isLowStock',
                'status',
            ],
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                productId: { type: 'string', format: 'uuid' },
                ...variantInput.properties,
                averageCost: money,
                currentQuantity: quantity,
                inventoryValue: money,
                isLowStock: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                deletedAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
            },
        },
        InventoryProduct: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                ...productInput.properties,
                variants: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InventoryVariant' },
                },
                totalQuantity: quantity,
                totalValue: money,
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                deletedAt: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                },
            },
        },
        CreateInventoryVariantInput: {
            ...variantInput,
            required: ['name', 'sku'],
        },
        UpdateInventoryVariantInput: variantInput,
        CreateInventoryProductInput: {
            ...productInput,
            required: ['name', 'unit', 'variants'],
            properties: {
                ...productInput.properties,
                variants: {
                    type: 'array',
                    minItems: 1,
                    items: {
                        $ref: '#/components/schemas/CreateInventoryVariantInput',
                    },
                },
            },
        },
        UpdateInventoryProductInput: productInput,
        InventoryMovement: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                organizationId: { type: 'string', format: 'uuid' },
                productId: { type: 'string', format: 'uuid' },
                productName: { type: 'string' },
                variantId: { type: 'string', format: 'uuid' },
                variantName: { type: 'string' },
                variantSku: { type: 'string' },
                type: {
                    type: 'string',
                    enum: ['ENTRY', 'EXIT', 'ADJUSTMENT'],
                },
                quantity,
                unitCost: money,
                totalCost: money,
                supplierId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
                supplierName: { type: 'string', nullable: true },
                reason: { type: 'string', nullable: true },
                notes: { type: 'string', nullable: true },
                movementDate: { type: 'string', format: 'date-time' },
                createdBy: { type: 'string', format: 'uuid' },
                creatorName: { type: 'string' },
                reversalOfMovementId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
                reversedByMovementId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
                createdAt: { type: 'string', format: 'date-time' },
            },
        },
        CreateInventoryMovementInput: {
            type: 'object',
            required: ['variantId', 'type', 'quantity', 'movementDate'],
            properties: {
                variantId: { type: 'string', format: 'uuid' },
                type: { type: 'string', enum: ['ENTRY', 'EXIT'] },
                quantity,
                unitCost: { ...money, nullable: true },
                supplierId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                },
                reason: { type: 'string', nullable: true },
                notes: { type: 'string', nullable: true },
                movementDate: { type: 'string', format: 'date-time' },
            },
        },
        CreateInventoryAdjustmentInput: {
            type: 'object',
            required: [
                'variantId',
                'countedQuantity',
                'reason',
                'movementDate',
            ],
            properties: {
                variantId: { type: 'string', format: 'uuid' },
                countedQuantity: quantity,
                unitCost: { ...money, nullable: true },
                reason: { type: 'string' },
                notes: { type: 'string', nullable: true },
                movementDate: { type: 'string', format: 'date-time' },
            },
        },
        ReverseInventoryMovementInput: {
            type: 'object',
            required: ['reason', 'movementDate'],
            properties: {
                reason: { type: 'string' },
                movementDate: { type: 'string', format: 'date-time' },
            },
        },
        InventorySummary: {
            type: 'object',
            properties: {
                activeProducts: { type: 'integer' },
                activeSkus: { type: 'integer' },
                totalQuantity: quantity,
                totalValue: money,
                zeroStockCount: { type: 'integer' },
                lowStockCount: { type: 'integer' },
                lowStockItems: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            productId: { type: 'string', format: 'uuid' },
                            productName: { type: 'string' },
                            variantId: { type: 'string', format: 'uuid' },
                            variantName: { type: 'string' },
                            sku: { type: 'string' },
                            currentQuantity: quantity,
                            minimumQuantity: quantity,
                        },
                    },
                },
            },
        },
    },
    paths: {
        '/inventory/products': {
            get: operation({
                summary: 'Lista produtos e variacoes',
                permission: 'inventory.products.read',
                responseSchema: { type: 'object' },
            }),
            post: operation({
                summary: 'Cria produto com variacoes',
                permission: 'inventory.products.manage',
                requestSchema: 'CreateInventoryProductInput',
                responseSchema: {
                    $ref: '#/components/schemas/InventoryProduct',
                },
                created: true,
                conflict: true,
            }),
        },
        '/inventory/products/{id}': {
            get: operation({
                summary: 'Busca produto',
                permission: 'inventory.products.read',
                parameters: [idParameter],
                responseSchema: {
                    $ref: '#/components/schemas/InventoryProduct',
                },
                notFound: true,
            }),
            patch: operation({
                summary: 'Atualiza produto',
                permission: 'inventory.products.manage',
                parameters: [idParameter],
                requestSchema: 'UpdateInventoryProductInput',
                responseSchema: {
                    $ref: '#/components/schemas/InventoryProduct',
                },
                notFound: true,
            }),
            delete: operation({
                summary: 'Remove produto sem historico',
                permission: 'inventory.products.manage',
                parameters: [idParameter],
                noContent: true,
                notFound: true,
                conflict: true,
            }),
        },
        '/inventory/products/{id}/variants': {
            post: operation({
                summary: 'Adiciona variante',
                permission: 'inventory.products.manage',
                parameters: [idParameter],
                requestSchema: 'CreateInventoryVariantInput',
                responseSchema: {
                    $ref: '#/components/schemas/InventoryVariant',
                },
                created: true,
                notFound: true,
                conflict: true,
            }),
        },
        '/inventory/products/{id}/variants/{variantId}': {
            patch: operation({
                summary: 'Atualiza variante',
                permission: 'inventory.products.manage',
                parameters: [idParameter, variantIdParameter],
                requestSchema: 'UpdateInventoryVariantInput',
                responseSchema: {
                    $ref: '#/components/schemas/InventoryVariant',
                },
                notFound: true,
                conflict: true,
            }),
            delete: operation({
                summary: 'Remove variante sem historico',
                permission: 'inventory.products.manage',
                parameters: [idParameter, variantIdParameter],
                noContent: true,
                notFound: true,
                conflict: true,
            }),
        },
        '/inventory/movements': {
            get: operation({
                summary: 'Lista movimentos',
                permission: 'inventory.movements.read',
                responseSchema: { type: 'object' },
            }),
            post: operation({
                summary: 'Registra entrada ou saida',
                permission: 'inventory.movements.manage',
                requestSchema: 'CreateInventoryMovementInput',
                responseSchema: {
                    $ref: '#/components/schemas/InventoryMovement',
                },
                created: true,
                conflict: true,
            }),
        },
        '/inventory/movements/{id}': {
            get: operation({
                summary: 'Busca movimento',
                permission: 'inventory.movements.read',
                parameters: [idParameter],
                responseSchema: {
                    $ref: '#/components/schemas/InventoryMovement',
                },
                notFound: true,
            }),
        },
        '/inventory/movements/{id}/reverse': {
            post: operation({
                summary: 'Estorna movimento',
                permission: 'inventory.movements.manage',
                parameters: [idParameter],
                requestSchema: 'ReverseInventoryMovementInput',
                responseSchema: {
                    $ref: '#/components/schemas/InventoryMovement',
                },
                created: true,
                notFound: true,
                conflict: true,
            }),
        },
        '/inventory/adjustments': {
            post: operation({
                summary: 'Ajusta estoque pela contagem fisica',
                permission: 'inventory.movements.manage',
                requestSchema: 'CreateInventoryAdjustmentInput',
                responseSchema: {
                    $ref: '#/components/schemas/InventoryMovement',
                },
                created: true,
                conflict: true,
            }),
        },
        '/inventory/summary': {
            get: operation({
                summary: 'Consulta resumo do estoque',
                permission: 'inventory.summary.read',
                responseSchema: {
                    $ref: '#/components/schemas/InventorySummary',
                },
            }),
        },
    },
}
