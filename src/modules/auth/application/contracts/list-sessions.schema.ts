import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const listSessionsSchema = z.object({
    authUser: authUserSchema,
})
