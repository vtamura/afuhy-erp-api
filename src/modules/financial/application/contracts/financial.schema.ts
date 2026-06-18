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

const transactionPayloadSchema = z.object({
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

const counterpartiesDoNotOverlap = (data: {
    customerId?: string | null
    supplierId?: string | null
}) => !(data.customerId && data.supplierId)

export const createFinancialTransactionSchema = transactionPayloadSchema
    .extend({
        authUser: authUserSchema,
    })
    .refine(counterpartiesDoNotOverlap, {
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
export const getFinancialDashboardSchema = z.object({
    authUser: authUserSchema,
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
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

export const updateFinancialTransactionSchema = transactionPayloadSchema
    .partial()
    .extend(idWithAuthSchema.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
    .refine(counterpartiesDoNotOverlap, {
        message: 'Cliente e fornecedor nao podem ser informados juntos',
        path: ['customerId'],
    })
export const getFinancialTransactionSchema = idWithAuthSchema
export const deleteFinancialTransactionSchema = idWithAuthSchema
export const payFinancialTransactionSchema = idWithAuthSchema.extend({
    settlementDate: dateSchema.optional(),
})
export const cancelFinancialTransactionSchema = idWithAuthSchema

const obligationPayloadSchema = z.object({
    accountId: z.string().uuid(),
    categoryId: z.string().uuid(),
    counterpartyId: nullableUuid,
    description: z.string().trim().min(1).max(255),
    notes: nullableText(5000),
    amount: positiveMoneySchema,
    transactionDate: dateSchema,
    dueDate: dateSchema,
})

export const createFinancialObligationSchema = obligationPayloadSchema
    .extend({
        authUser: authUserSchema,
    })
    .refine((data) => data.dueDate >= data.transactionDate, {
        message: 'Vencimento deve ser igual ou posterior a data do lancamento',
        path: ['dueDate'],
    })

export const updateFinancialObligationSchema = obligationPayloadSchema
    .partial()
    .extend(idWithAuthSchema.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
    .refine(
        (data) =>
            !data.transactionDate ||
            !data.dueDate ||
            data.dueDate >= data.transactionDate,
        {
            message:
                'Vencimento deve ser igual ou posterior a data do lancamento',
            path: ['dueDate'],
        },
    )
export const getFinancialObligationSchema = idWithAuthSchema
export const deleteFinancialObligationSchema = idWithAuthSchema
export const cancelFinancialObligationSchema = idWithAuthSchema
export const settleFinancialObligationSchema = idWithAuthSchema.extend({
    settlementDate: dateSchema,
})
export const listFinancialObligationsSchema = z
    .object({
        authUser: authUserSchema,
        status: z.enum(['PENDING', 'PAID', 'CANCELED']).optional(),
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        counterpartyId: z.string().uuid().optional(),
        dueDateStart: dateSchema.optional(),
        dueDateEnd: dateSchema.optional(),
        overdue: z
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
    .refine(
        (data) =>
            !data.dueDateStart ||
            !data.dueDateEnd ||
            data.dueDateStart <= data.dueDateEnd,
        {
            message: 'Vencimento inicial deve ser anterior ao final',
            path: ['dueDateStart'],
        },
    )

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
