import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const createStripePortalSessionSchema = z.object({
    authUser: authUserSchema,
})
