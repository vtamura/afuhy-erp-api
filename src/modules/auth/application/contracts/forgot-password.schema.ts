import { z } from 'zod'

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .trim()
        .email()
        .max(180)
        .transform((value) => value.toLowerCase()),
})
