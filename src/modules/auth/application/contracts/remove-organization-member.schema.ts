import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const removeOrganizationMemberSchema = z.object({
    id: z.string().uuid(),
    organizationUserId: z.string().uuid(),
    authUser: authUserSchema,
})
