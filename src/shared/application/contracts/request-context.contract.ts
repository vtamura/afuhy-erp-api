import { z } from 'zod'

export const authUserSchema = z.object({
  userId: z.coerce.number().int().positive(),
  companyId: z.string().optional(),
})

export type AuthUser = z.infer<typeof authUserSchema>

export const requestContextSchema = z.object({
    authUser: authUserSchema.optional(),
    attributes: z.array(z.unknown()).optional(),
    attributeExpression: z.string().trim().min(1).optional(),
})
