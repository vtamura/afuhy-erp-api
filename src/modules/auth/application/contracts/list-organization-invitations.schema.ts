import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const listOrganizationInvitationsSchema = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})
