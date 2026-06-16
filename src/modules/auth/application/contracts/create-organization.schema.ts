import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

export const createOrganizationSchema = z.object({
    name: z.string().trim().min(1).max(150),
    document: z.string().trim().min(1).max(20),
    documentType: z.enum(['CPF', 'CNPJ']),
    authUser: authUserSchema,
})
