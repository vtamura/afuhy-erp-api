import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'
import { normalizeHrMoney } from '../../domain/money/hr-money'
import {
    estimateHrCompensation,
    HrCompensationEstimationError,
} from '../services/hr-compensation-estimator'

const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve usar o formato YYYY-MM-DD')
const statusSchema = z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED'])
const catalogStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])
const contractTypeSchema = z.enum(['CLT', 'TEMPORARY', 'PJ', 'FREELANCER'])
const payFrequencySchema = z.enum([
    'MONTHLY',
    'WEEKLY',
    'BIWEEKLY',
    'DAILY',
    'HOURLY',
])
const estimatedWorkloadUnitSchema = z.enum([
    'FIXED_MONTHLY',
    'WEEKS_PER_MONTH',
    'FORTNIGHTS_PER_MONTH',
    'DAYS_PER_MONTH',
    'DAYS_PER_WEEK',
    'HOURS_PER_MONTH',
    'HOURS_PER_WEEK',
])
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
const monthlyUnitsSchema = z.coerce
    .number()
    .positive('Unidades mensais estimadas deve ser maior que zero')
    .max(10000, 'Unidades mensais estimadas muito alta')
    .transform((value) => value.toFixed(4))
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

const compensationFields = {
    contractType: contractTypeSchema,
    payFrequency: payFrequencySchema,
    estimatedWorkload: z
        .object({
            unit: estimatedWorkloadUnitSchema,
            amount: z.coerce
                .number()
                .positive(
                    'Quantidade da carga estimada deve ser maior que zero',
                )
                .max(10000, 'Quantidade da carga estimada muito alta')
                .optional(),
        })
        .optional(),
    estimatedMonthlyUnits: monthlyUnitsSchema.optional(),
    contractStartDate: dateSchema.optional(),
    contractEndDate: dateSchema
        .nullable()
        .optional()
        .transform((value) => value ?? null),
}

const normalizeCompensation =
    <
        T extends {
            contractType: z.infer<typeof contractTypeSchema>
            payFrequency: z.infer<typeof payFrequencySchema>
            estimatedWorkload?: {
                unit: z.infer<typeof estimatedWorkloadUnitSchema>
                amount?: number
            }
            estimatedMonthlyUnits?: string
            contractEndDate?: string | null
            currentPayAmount?: string
            payAmount?: string
        },
    >(
        validateContractDates: boolean,
    ) =>
    (value: T, context: z.RefinementCtx) => {
        let estimatedMonthlyUnits = value.estimatedMonthlyUnits
        const payAmount = value.currentPayAmount ?? value.payAmount
        if (payAmount) {
            try {
                estimatedMonthlyUnits = estimateHrCompensation({
                    payAmount,
                    payFrequency: value.payFrequency,
                    estimatedWorkload: value.estimatedWorkload,
                    estimatedMonthlyUnits: value.estimatedMonthlyUnits,
                }).estimatedMonthlyUnits
            } catch (error) {
                if (error instanceof HrCompensationEstimationError) {
                    context.addIssue({
                        code: 'custom',
                        path: error.path,
                        message: error.message,
                    })
                } else {
                    throw error
                }
            }
        } else if (
            (value.payFrequency === 'DAILY' ||
                value.payFrequency === 'HOURLY') &&
            !estimatedMonthlyUnits
        ) {
            context.addIssue({
                code: 'custom',
                path: ['estimatedMonthlyUnits'],
                message:
                    'Unidades mensais estimadas sao obrigatorias para pagamento diario ou por hora',
            })
        }
        if (
            validateContractDates &&
            value.contractType === 'TEMPORARY' &&
            !value.contractEndDate
        ) {
            context.addIssue({
                code: 'custom',
                path: ['contractEndDate'],
                message: 'Contrato temporario exige data final',
            })
        }
        if (
            validateContractDates &&
            value.contractType === 'CLT' &&
            value.contractEndDate
        ) {
            context.addIssue({
                code: 'custom',
                path: ['contractEndDate'],
                message: 'Contrato CLT nao deve ter data final no MVP',
            })
        }
        return {
            ...value,
            estimatedMonthlyUnits: estimatedMonthlyUnits ?? '1.0000',
        }
    }

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

export const createEmployeeSchema = z
    .object({
        ...employeeEditable,
        departmentId: z.string().uuid(),
        positionId: z.string().uuid(),
        hireDate: dateSchema,
        currentPayAmount: moneySchema,
        ...compensationFields,
        authUser: authUserSchema,
    })
    .transform(normalizeCompensation(true))
export const createCompensationPreviewSchema = z
    .object({
        authUser: authUserSchema,
        contractType: contractTypeSchema,
        payFrequency: payFrequencySchema,
        payAmount: moneySchema,
        estimatedWorkload: compensationFields.estimatedWorkload,
        estimatedMonthlyUnits: monthlyUnitsSchema.optional(),
    })
    .transform(normalizeCompensation(false))
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
export const createSalaryChangeSchema = idWithAuth
    .extend({
        payAmount: moneySchema,
        ...compensationFields,
        effectiveDate: dateSchema,
        reason: nullableText(500),
    })
    .transform(normalizeCompensation(true))
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
