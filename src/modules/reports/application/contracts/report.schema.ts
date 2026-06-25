import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const getReportDashboardSchema = z.object({
    authUser: authUserSchema,
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
})
