import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const updateMemberRolesSchema = z.object({
    id: z.string().uuid(),
    organizationUserId: z.string().uuid(),
    roleCodes: z.array(z.string().trim().min(1).max(100)).min(1),
    authUser: authUserSchema,
})
