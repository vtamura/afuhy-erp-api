import { z } from 'zod'
import { authUserSchema } from '../../../../shared/application/contracts'

const taskStatusSchema = z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'])
const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
const nullableText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .transform((value) => (value.length ? value : null))
        .nullable()
        .optional()
        .transform((value) => value ?? null)
const nullableUuid = z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((value) => value ?? null)
const nullableDateTime = z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((value) => value ?? null)
const idWithAuthSchema = z.object({
    id: z.string().uuid(),
    authUser: authUserSchema,
})
const taskEditableShape = {
    title: z.string().trim().min(1).max(200),
    description: nullableText(10000),
    priority: taskPrioritySchema,
    assigneeOrganizationUserId: nullableUuid,
    dueAt: nullableDateTime,
}

export const createTaskSchema = z.object({
    title: taskEditableShape.title,
    description: taskEditableShape.description,
    status: taskStatusSchema.default('BACKLOG'),
    priority: taskPrioritySchema.default('MEDIUM'),
    assigneeOrganizationUserId: taskEditableShape.assigneeOrganizationUserId,
    dueAt: taskEditableShape.dueAt,
    authUser: authUserSchema,
})

export const updateTaskSchema = z
    .object(taskEditableShape)
    .partial()
    .extend(idWithAuthSchema.shape)
    .refine(
        ({ id: _id, authUser: _authUser, ...data }) =>
            Object.keys(data).length > 0,
        'Informe ao menos um campo para atualizar',
    )

export const listTasksSchema = z
    .object({
        authUser: authUserSchema,
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.optional(),
        assigneeOrganizationUserId: z.string().uuid().optional(),
        dueFrom: z.string().datetime().optional(),
        dueTo: z.string().datetime().optional(),
        overdue: z
            .union([z.literal('true'), z.literal('false'), z.boolean()])
            .optional()
            .transform((value) =>
                value === undefined
                    ? undefined
                    : value === true || value === 'true',
            ),
        search: z.string().trim().min(1).max(200).optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
    })
    .refine(
        (data) => !data.dueFrom || !data.dueTo || data.dueFrom <= data.dueTo,
        {
            message: 'Prazo inicial deve ser anterior ao prazo final',
            path: ['dueFrom'],
        },
    )

export const listTaskBoardSchema = z.object({ authUser: authUserSchema })
export const getTaskSchema = idWithAuthSchema
export const deleteTaskSchema = idWithAuthSchema
export const moveTaskSchema = idWithAuthSchema.extend({
    status: taskStatusSchema,
    position: z.number().int().min(0),
})
export const listTaskCommentsSchema = idWithAuthSchema
export const createTaskCommentSchema = idWithAuthSchema.extend({
    content: z.string().trim().min(1).max(5000),
})
