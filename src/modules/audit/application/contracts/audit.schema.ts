import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

const auditActionSchema = z.enum([
    'CREATE',
    'UPDATE',
    'DELETE',
    'RESTORE',
    'STATUS_CHANGE',
    'LOGIN',
    'LOGOUT',
    'PERMISSION_CHANGE',
    'WEBHOOK_RECEIVED',
    'WEBHOOK_PROCESSED',
    'READ_SENSITIVE',
])

const auditActorTypeSchema = z.enum(['USER', 'SYSTEM', 'STRIPE'])

export const listAuditLogsSchema = z.object({
    authUser: authUserSchema,
    requestId: z.string().uuid().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    module: z.string().trim().min(1).max(80).optional(),
    action: auditActionSchema.optional(),
    actorType: auditActorTypeSchema.optional(),
    actorUserId: z.string().uuid().optional(),
    entityType: z.string().trim().min(1).max(120).optional(),
    entityId: z.string().trim().min(1).max(120).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    search: z.string().trim().min(1).max(120).optional(),
})

export const getAuditLogSchema = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
    requestId: z.string().uuid().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
})
