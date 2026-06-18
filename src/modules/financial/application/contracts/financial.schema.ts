import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'
import { normalizeMoney } from '../../domain/money/money'

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve usar o formato YYYY-MM-DD')

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

const moneySchema = z
    .string()
    .trim()
    .regex(/^-?\d{1,13}(?:\.\d{1,2})?$/, 'Valor monetario invalido')
    .transform(normalizeMoney)

const positiveMoneySchema = moneySchema.refine(
    (value) => !value.startsWith('-') && value !== '0.00',
    'Valor deve ser maior que zero',
)

const accountPayloadSchema = z.object({
    name: z.string().trim().min(1).max(150),
    type: z.enum(['CASH', 'BANK', 'DIGITAL_WALLET']),
    initialBalance: moneySchema.default('0.00'),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

const categoryPayloadSchema = z.object({
    name: z.string().trim().min(1).max(150),
    type: z.enum(['INCOME', 'EXPENSE']),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

const transactionPayloadSchema = z
    .object({
        accountId: z.string().uuid(),
        categoryId: z.string().uuid(),
        customerId: nullableUuid,
        supplierId: nullableUuid,
        description: z.string().trim().min(1).max(255),
        notes: nullableText(5000),
        type: z.enum(['INCOME', 'EXPENSE']),
        amount: positiveMoneySchema,
        transactionDate: dateSchema,
        dueDate: dateSchema
            .nullable()
            .optional()
            .transform((value) => value ?? null),
    })
    .refine((data) => !(data.customerId && data.supplierId), {
        message: 'Cliente e fornecedor nao podem ser informados juntos',
        path: ['customerId'],
    })

const idWithAuthSchema = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})

export const createFinancialAccountSchema = accountPayloadSchema.extend({
    authUser: authUserSchema,
})
export const updateFinancialAccountSchema = accountPayloadSchema
    .partial()
    .extend(idWithAuthSchema.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
export const listFinancialAccountsSchema = z.object({
    authUser: authUserSchema,
})
export const getFinancialAccountSchema = idWithAuthSchema
export const deleteFinancialAccountSchema = idWithAuthSchema

export const createFinancialCategorySchema = categoryPayloadSchema.extend({
    authUser: authUserSchema,
})
export const updateFinancialCategorySchema = categoryPayloadSchema
    .partial()
    .extend(idWithAuthSchema.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
export const listFinancialCategoriesSchema = z.object({
    authUser: authUserSchema,
})
export const getFinancialCategorySchema = idWithAuthSchema
export const deleteFinancialCategorySchema = idWithAuthSchema

export const createFinancialTransactionSchema = transactionPayloadSchema.extend(
    {
        authUser: authUserSchema,
    },
)
export const updateFinancialTransactionSchema = transactionPayloadSchema
    .partial()
    .extend(idWithAuthSchema.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
    .refine((data) => !(data.customerId && data.supplierId), {
        message: 'Cliente e fornecedor nao podem ser informados juntos',
        path: ['customerId'],
    })
export const getFinancialTransactionSchema = idWithAuthSchema
export const deleteFinancialTransactionSchema = idWithAuthSchema
export const payFinancialTransactionSchema = idWithAuthSchema
export const cancelFinancialTransactionSchema = idWithAuthSchema

export const listFinancialTransactionsSchema = z
    .object({
        authUser: authUserSchema,
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
        supplierId: z.string().uuid().optional(),
        type: z.enum(['INCOME', 'EXPENSE']).optional(),
        status: z.enum(['PENDING', 'PAID', 'CANCELED']).optional(),
        startDate: dateSchema.optional(),
        endDate: dateSchema.optional(),
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
