import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const setOrganizationSubscriptionSchema = z.object({
    id: z.string().uuid(),
    planCode: z.enum(['STARTER', 'PROFESSIONAL']),
    status: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED']),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    authUser: authUserSchema,
    requestId: z.string().uuid().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
})
