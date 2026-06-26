import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const createStripePortalSessionSchema = z.object({
    authUser: authUserSchema,
    requestId: z.string().uuid().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
})
