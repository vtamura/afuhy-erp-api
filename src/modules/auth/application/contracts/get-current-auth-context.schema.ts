import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const getCurrentAuthContextSchema = z.object({
    authUser: authUserSchema,
})
