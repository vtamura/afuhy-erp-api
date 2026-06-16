import { z } from 'zod'

export const logoutSchema = z.object({
    cookies: z.record(z.string(), z.string().optional()).optional(),
})
