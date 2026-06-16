import { z } from 'zod'

export const selectOrganizationSchema = z.object({
    organizationId: z.string().uuid(),
    cookies: z.record(z.string(), z.string().optional()).optional(),
})
