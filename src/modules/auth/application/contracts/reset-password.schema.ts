import { z } from 'zod'

export const resetPasswordSchema = z.object({
    token: z.string().trim().min(1),
    newPassword: z.string().min(8),
})
