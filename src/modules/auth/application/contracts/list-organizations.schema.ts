import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const listOrganizationsSchema = z.object({
    authUser: authUserSchema,
})
