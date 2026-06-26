import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const createStripeCheckoutSessionSchema = z.object({
    planCode: z.enum(['STARTER', 'PROFESSIONAL']),
    authUser: authUserSchema,
})
