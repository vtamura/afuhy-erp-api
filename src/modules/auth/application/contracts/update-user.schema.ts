import { z } from 'zod'

export const updateUserSchema = z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(150),
    email: z
        .string()
        .trim()
        .email()
        .max(180)
        .transform((value) => value.toLowerCase()),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
})
