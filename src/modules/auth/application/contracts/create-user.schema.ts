import { z } from 'zod'

export const createUserSchema = z.object({
    name: z.string().trim().min(1).max(150),
    email: z
        .email()
        .trim()
        .max(180)
        .transform((value) => value.toLowerCase()),
    password: z.string().min(8),
})
