import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'
import {
    normalizeLoanMoney,
    normalizeLoanQuantity,
} from '../../domain/decimal/loan-decimal'

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

const quantitySchema = z
    .string()
    .trim()
    .regex(/^\d{1,12}(?:\.\d{1,3})?$/, 'Quantidade invalida')
    .transform(normalizeLoanQuantity)
    .refine((value) => value !== '0.000', 'Quantidade deve ser maior que zero')

const moneySchema = z
    .string()
    .trim()
    .regex(/^\d{1,13}(?:\.\d{1,2})?$/, 'Valor monetario invalido')
    .transform(normalizeLoanMoney)
    .refine((value) => value !== '0.00', 'Valor deve ser maior que zero')

const loanItemSchema = z.object({
    variantId: z.string().uuid(),
    quantity: quantitySchema,
    notes: nullableText(1000),
})

const idWithAuth = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})

const validateBorrower = (data: {
    borrowerType: 'CUSTOMER' | 'EMPLOYEE'
    customerId: string | null
    employeeId: string | null
}) =>
    (data.borrowerType === 'CUSTOMER' &&
        !!data.customerId &&
        !data.employeeId) ||
    (data.borrowerType === 'EMPLOYEE' && !!data.employeeId && !data.customerId)

const loanPayloadBaseSchema = z.object({
    borrowerType: z.enum(['CUSTOMER', 'EMPLOYEE']),
    customerId: nullableUuid,
    employeeId: nullableUuid,
    expectedReturnDate: dateSchema,
    notes: nullableText(5000),
    items: z.array(loanItemSchema).min(1),
})

const loanPayloadSchema = loanPayloadBaseSchema.refine(
    (data) => validateBorrower(data),
    {
        message: 'Informe exatamente um tomador conforme o tipo',
        path: ['borrowerType'],
    },
)

export const createLoanSchema = loanPayloadSchema.extend({
    authUser: authUserSchema,
})

export const updateLoanSchema = loanPayloadBaseSchema
    .partial()
    .extend(idWithAuth.shape)

export const getLoanSchema = idWithAuth
export const cancelLoanSchema = idWithAuth

export const releaseLoanSchema = idWithAuth.extend({
    releasedAt: dateSchema.optional(),
    feeAmount: moneySchema.optional(),
    feeCategoryId: z.string().uuid().optional(),
    feeDueDate: dateSchema.optional(),
    feeDescription: z.string().trim().min(1).max(255).optional(),
    idempotencyKey: z.string().trim().min(1).max(120).optional(),
})

export const loanEventItemSchema = z.object({
    loanItemId: z.string().uuid(),
    quantity: quantitySchema,
})

export const createLoanReturnSchema = idWithAuth.extend({
    returnedAt: dateSchema.optional(),
    notes: nullableText(5000),
    idempotencyKey: z.string().trim().min(1).max(120).optional(),
    items: z.array(loanEventItemSchema).min(1),
})

const chargePayloadSchema = z.object({
    type: z.enum(['FEE', 'LATE_FEE', 'DAMAGE']),
    categoryId: z.string().uuid(),
    amount: moneySchema,
    dueDate: dateSchema,
    description: z.string().trim().min(1).max(255),
    idempotencyKey: z.string().trim().min(1).max(120).optional(),
})

export const createLoanOccurrenceSchema = idWithAuth.extend({
    type: z.enum(['LOSS', 'DAMAGE']),
    occurredAt: dateSchema.optional(),
    description: nullableText(5000),
    idempotencyKey: z.string().trim().min(1).max(120).optional(),
    items: z.array(loanEventItemSchema).min(1),
    charge: chargePayloadSchema.optional(),
})

export const createLoanChargeSchema = idWithAuth.extend(
    chargePayloadSchema.shape,
)

export const cancelLoanChargeSchema = idWithAuth.extend({
    chargeId: z.string().uuid(),
})

export const listLoansSchema = z.object({
    authUser: authUserSchema,
    status: z
        .enum([
            'DRAFT',
            'RELEASED',
            'PARTIALLY_RETURNED',
            'COMPLETED',
            'CANCELED',
        ])
        .optional(),
    borrowerType: z.enum(['CUSTOMER', 'EMPLOYEE']).optional(),
    borrowerId: z.string().uuid().optional(),
    overdue: z
        .union([z.literal('true'), z.literal('false'), z.boolean()])
        .optional()
        .transform((value) =>
            value === undefined
                ? undefined
                : value === true || value === 'true',
        ),
    search: z.string().trim().min(1).max(200).optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
