import { z } from 'zod'

export const acceptOrganizationInvitationSchema = z.object({
    token: z.string().trim().min(1),
    name: z.string().trim().min(1).max(150).optional(),
    password: z.string().min(8).optional(),
})
