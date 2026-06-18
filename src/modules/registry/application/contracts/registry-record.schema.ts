import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

const nullableText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .transform((value) => (value.length ? value : null))
        .nullable()
        .optional()
        .transform((value) => value ?? null)

const documentSchema = z
    .string()
    .trim()
    .max(32)
    .transform((value) => value.replace(/\s+/g, ''))
    .transform((value) => (value.length ? value : null))
    .nullable()
    .optional()
    .transform((value) => value ?? null)

const emailSchema = z
    .string()
    .trim()
    .email()
    .max(180)
    .transform((value) => value.toLowerCase())
    .nullable()
    .optional()
    .transform((value) => value ?? null)

const recordPayloadSchema = z.object({
    name: z.string().trim().min(1).max(150),
    document: documentSchema,
    documentType: z.enum(['CPF', 'CNPJ', 'OTHER']).nullable().optional(),
    email: emailSchema,
    phone: nullableText(40),
    notes: nullableText(5000),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const createRegistryRecordSchema = recordPayloadSchema.extend({
    authUser: authUserSchema,
})

export const updateRegistryRecordSchema = recordPayloadSchema.extend({
    id: z.string().uuid(),
    authUser: authUserSchema,
})

export const getRegistryRecordSchema = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})

export const listRegistryRecordsSchema = z.object({
    authUser: authUserSchema,
})

export const deleteRegistryRecordSchema = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})
