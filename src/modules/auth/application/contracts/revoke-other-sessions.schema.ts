import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const revokeOtherSessionsSchema = z.object({
    authUser: authUserSchema,
})
