import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const listOrganizationMembersSchema = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})
