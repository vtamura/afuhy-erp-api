import { z } from 'zod'

export const loginSchema = z.object({
    email: z
        .email()
        .trim()
        .max(180)
        .transform((value) => value.toLowerCase()),
    password: z.string().min(1),
    headers: z
        .object({
            'user-agent': z.union([z.string(), z.array(z.string())]).optional(),
            'x-forwarded-for': z
                .union([z.string(), z.array(z.string())])
                .optional(),
        })
        .passthrough()
        .optional(),
})
