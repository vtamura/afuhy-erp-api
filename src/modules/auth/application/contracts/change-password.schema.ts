import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    authUser: authUserSchema,
})
