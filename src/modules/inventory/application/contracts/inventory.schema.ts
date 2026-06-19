import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'
import {
    normalizeInventoryMoney,
    normalizeQuantity,
} from '../../domain/decimal/inventory-decimal'

const statusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const unitSchema = z.enum(['UN', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'CX'])
const movementTypeSchema = z.enum(['ENTRY', 'EXIT'])
const nullableText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .transform((value) => (value.length ? value : null))
        .nullable()
        .optional()
        .transform((value) => value ?? null)
const nullableUuid = z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((value) => value ?? null)
const quantitySchema = z
    .string()
    .trim()
    .regex(/^\d{1,12}(?:\.\d{1,3})?$/, 'Quantidade invalida')
    .transform(normalizeQuantity)
const positiveQuantitySchema = quantitySchema.refine(
    (value) => value !== '0.000',
    'Quantidade deve ser maior que zero',
)
const moneySchema = z
    .string()
    .trim()
    .regex(/^\d{1,13}(?:\.\d{1,2})?$/, 'Valor monetario invalido')
    .transform(normalizeInventoryMoney)
const variantShape = {
    name: z.string().trim().min(1).max(150),
    sku: z.string().trim().min(1).max(100),
    barcode: nullableText(100),
    salePrice: moneySchema.default('0.00'),
    minimumQuantity: quantitySchema.default('0.000'),
    status: statusSchema.default('ACTIVE'),
}
const productShape = {
    name: z.string().trim().min(1).max(180),
    description: nullableText(10000),
    unit: unitSchema,
    status: statusSchema.default('ACTIVE'),
}
const idWithAuthSchema = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})

export const createInventoryProductSchema = z.object({
    ...productShape,
    variants: z.array(z.object(variantShape)).min(1),
    authUser: authUserSchema,
})
export const updateInventoryProductSchema = z
    .object(productShape)
    .partial()
    .extend(idWithAuthSchema.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
export const listInventoryProductsSchema = z.object({
    authUser: authUserSchema,
    status: statusSchema.optional(),
    search: z.string().trim().min(1).max(200).optional(),
    lowStock: z
        .union([z.literal('true'), z.literal('false'), z.boolean()])
        .optional()
        .transform((value) =>
            value === undefined
                ? undefined
                : value === true || value === 'true',
        ),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const getInventoryProductSchema = idWithAuthSchema
export const deleteInventoryProductSchema = idWithAuthSchema
export const addInventoryVariantSchema = z.object({
    id: z.string().uuid(),
    ...variantShape,
    authUser: authUserSchema,
})
export const updateInventoryVariantSchema = z
    .object(variantShape)
    .partial()
    .extend({
        id: z.string().uuid(),
        variantId: z.string().uuid(),
        authUser: authUserSchema,
    })
    .refine(
        ({ id: _id, variantId: _variantId, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
export const deleteInventoryVariantSchema = z.object({
    id: z.string().uuid(),
    variantId: z.string().uuid(),
    authUser: authUserSchema,
})

export const createInventoryMovementSchema = z
    .object({
        variantId: z.string().uuid(),
        type: movementTypeSchema,
        quantity: positiveQuantitySchema,
        unitCost: moneySchema.nullable().optional(),
        supplierId: nullableUuid,
        reason: nullableText(255),
        notes: nullableText(5000),
        movementDate: z.string().datetime(),
        authUser: authUserSchema,
    })
    .refine((data) => data.type !== 'ENTRY' || data.unitCost != null, {
        message: 'Custo unitario e obrigatorio para entradas',
        path: ['unitCost'],
    })
    .refine((data) => data.type !== 'EXIT' || data.supplierId == null, {
        message: 'Fornecedor nao e aceito em saidas',
        path: ['supplierId'],
    })
export const createInventoryAdjustmentSchema = z.object({
    variantId: z.string().uuid(),
    countedQuantity: quantitySchema,
    unitCost: moneySchema.nullable().optional(),
    reason: z.string().trim().min(1).max(255),
    notes: nullableText(5000),
    movementDate: z.string().datetime(),
    authUser: authUserSchema,
})
export const listInventoryMovementsSchema = z
    .object({
        authUser: authUserSchema,
        productId: z.string().uuid().optional(),
        variantId: z.string().uuid().optional(),
        type: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT']).optional(),
        supplierId: z.string().uuid().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
    })
    .refine(
        (data) =>
            !data.startDate || !data.endDate || data.startDate <= data.endDate,
        {
            message: 'Data inicial deve ser anterior a data final',
            path: ['startDate'],
        },
    )
export const getInventoryMovementSchema = idWithAuthSchema
export const reverseInventoryMovementSchema = idWithAuthSchema.extend({
    reason: z.string().trim().min(1).max(255),
    movementDate: z.string().datetime(),
})
export const getInventorySummarySchema = z.object({
    authUser: authUserSchema,
})
