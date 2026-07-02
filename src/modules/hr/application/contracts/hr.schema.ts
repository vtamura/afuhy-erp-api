import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'
import { normalizeHrMoney } from '../../domain/money/hr-money'

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve usar o formato YYYY-MM-DD')
const statusSchema = z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED'])
const catalogStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])
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
    .regex(/^\d{1,13}(?:\.\d{1,2})?$/, 'Valor monetario invalido')
    .transform(normalizeHrMoney)
    .refine((value) => value !== '0.00', 'Valor deve ser maior que zero')
const cpfSchema = z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .refine((value) => value.length === 11, 'CPF deve conter 11 digitos')
const nullableEmail = z
    .string()
    .trim()
    .email()
    .max(180)
    .transform((value) => value.toLowerCase())
    .nullable()
    .optional()
    .transform((value) => value ?? null)

const catalogPayload = z.object({
    name: z.string().trim().min(1).max(150),
    description: nullableText(5000),
    status: catalogStatusSchema.default('ACTIVE'),
})
const idWithAuth = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})

export const createHrCatalogSchema = catalogPayload.extend({
    authUser: authUserSchema,
})
export const updateHrCatalogSchema = catalogPayload
    .partial()
    .extend(idWithAuth.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
export const listHrCatalogSchema = z.object({ authUser: authUserSchema })
export const getHrCatalogSchema = idWithAuth
export const deleteHrCatalogSchema = idWithAuth

const employeeEditable = {
    organizationUserId: nullableUuid,
    name: z.string().trim().min(1).max(180),
    cpf: cpfSchema,
    registration: z.string().trim().min(1).max(60),
    email: nullableEmail,
    phone: nullableText(40),
    birthDate: dateSchema
        .nullable()
        .optional()
        .transform((value) => value ?? null),
    notes: nullableText(10000),
}

export const createEmployeeSchema = z.object({
    ...employeeEditable,
    departmentId: z.string().uuid(),
    positionId: z.string().uuid(),
    hireDate: dateSchema,
    initialSalary: moneySchema,
    authUser: authUserSchema,
})
export const updateEmployeeSchema = z
    .object({
        ...employeeEditable,
        status: statusSchema,
        terminationDate: dateSchema.nullable(),
        terminationReason: nullableText(500),
    })
    .partial()
    .extend(idWithAuth.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )
export const listEmployeesSchema = z.object({
    authUser: authUserSchema,
    status: statusSchema.optional(),
    departmentId: z.string().uuid().optional(),
    positionId: z.string().uuid().optional(),
    organizationUserId: z.string().uuid().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export const getEmployeeSchema = idWithAuth
export const deleteEmployeeSchema = idWithAuth
export const createEmployeeAssignmentSchema = idWithAuth.extend({
    departmentId: z.string().uuid(),
    positionId: z.string().uuid(),
    effectiveDate: dateSchema,
    reason: nullableText(500),
})
export const listEmployeeAssignmentsSchema = idWithAuth
export const createSalaryChangeSchema = idWithAuth.extend({
    salary: moneySchema,
    effectiveDate: dateSchema,
    reason: nullableText(500),
})
export const listSalaryChangesSchema = idWithAuth
export const getHrSummarySchema = z.object({
    authUser: authUserSchema,
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
})
export const createPayrollProvisionSchema = z
    .object({
        authUser: authUserSchema,
        year: z.coerce.number().int().min(2000).max(2100),
        month: z.coerce.number().int().min(1).max(12),
        dueDate: dateSchema,
        accountId: z.string().uuid(),
        categoryId: z.string().uuid(),
    })
    .refine(
        (data) =>
            data.dueDate >=
            `${data.year}-${String(data.month).padStart(2, '0')}-01`,
        {
            message: 'Vencimento deve ser igual ou posterior a competencia',
            path: ['dueDate'],
        },
    )
