import { z } from 'zod'

export const refreshSessionSchema = z.object({
    cookies: z.record(z.string(), z.string().optional()).optional(),
})
