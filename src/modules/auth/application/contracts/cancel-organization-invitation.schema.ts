import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const cancelOrganizationInvitationSchema = z.object({
    id: z.string().uuid(),
    invitationId: z.string().uuid(),
    authUser: authUserSchema,
})
