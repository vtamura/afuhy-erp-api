import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const getCurrentSubscriptionSchema = z.object({
    authUser: authUserSchema,
})
