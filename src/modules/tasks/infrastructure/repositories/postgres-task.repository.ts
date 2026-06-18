import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    TaskCommentEntity,
    TaskEntity,
    TaskPriority,
    TaskStatus,
} from '../../domain/entities/task.entity'
import type {
    TaskCreateData,
    TaskFilters,
    TaskPage,
    TaskRepository,
    TaskUpdateData,
} from '../../domain/repositories/task.repository'

type TaskRow = {
    id: string
    organization_id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    assignee_organization_user_id: string | null
    assignee_user_id: string | null
    assignee_name: string | null
    assignee_email: string | null
    created_by: string
    creator_name: string
    creator_email: string
    due_at: Date | null
    position: number
    completed_at: Date | null
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

type TaskCommentRow = {
    id: string
    organization_id: string
    task_id: string
    author_user_id: string
    author_name: string
    author_email: string
    content: string
    created_at: Date
}

const taskSelect = `
    SELECT
        tasks.*,
        assignee_user.id AS assignee_user_id,
        assignee_user.name AS assignee_name,
        assignee_user.email AS assignee_email,
        creator.name AS creator_name,
        creator.email AS creator_email
    FROM tasks
    INNER JOIN users creator
        ON creator.id = tasks.created_by
    LEFT JOIN organization_users assignee
        ON assignee.id = tasks.assignee_organization_user_id
    LEFT JOIN users assignee_user
        ON assignee_user.id = assignee.user_id
`

export class PostgresTaskRepository implements TaskRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(data: TaskCreateData): Promise<TaskEntity> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const [row] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO tasks (
                        organization_id,
                        title,
                        description,
                        status,
                        priority,
                        assignee_organization_user_id,
                        created_by,
                        due_at,
                        position,
                        completed_at
                    )
                    VALUES (
                        :organizationId,
                        :title,
                        :description,
                        :status,
                        :priority,
                        :assigneeOrganizationUserId,
                        :createdBy,
                        :dueAt,
                        (
                            SELECT COALESCE(MAX(position) + 1, 0)
                            FROM tasks
                            WHERE organization_id = :organizationId
                                AND status = :status
                                AND deleted_at IS NULL
                        ),
                        CASE WHEN :status = 'DONE' THEN NOW() ELSE NULL END
                    )
                    RETURNING id
                `,
                data,
            )

            return (await this.selectTask(databaseClient, {
                id: row.id,
                organizationId: data.organizationId,
            }))!
        })
    }

    async list(
        filters: TaskFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<TaskPage> {
        const { where, replacements } = this.buildFilters(filters)
        const offset = (pagination.page - 1) * pagination.pageSize
        const rows = await this.databaseClient.select<TaskRow>(
            `
                ${taskSelect}
                ${where}
                ORDER BY tasks.status, tasks.position, tasks.created_at DESC
                LIMIT :pageSize OFFSET :offset
            `,
            { ...replacements, pageSize: pagination.pageSize, offset },
        )
        const [count] = await this.databaseClient.select<{ total: string }>(
            `
                SELECT COUNT(*)::TEXT AS total
                FROM tasks
                ${where}
            `,
            replacements,
        )

        return {
            items: rows.map((row) => this.toTask(row)),
            total: Number(count.total),
        }
    }

    async listBoard(organizationId: string): Promise<TaskEntity[]> {
        const rows = await this.databaseClient.select<TaskRow>(
            `
                ${taskSelect}
                WHERE tasks.organization_id = :organizationId
                    AND tasks.deleted_at IS NULL
                ORDER BY tasks.status, tasks.position, tasks.created_at
            `,
            { organizationId },
        )
        return rows.map((row) => this.toTask(row))
    }

    findById(input: {
        id: string
        organizationId: string
    }): Promise<TaskEntity | null> {
        return this.selectTask(this.databaseClient, input)
    }

    async update(input: {
        id: string
        organizationId: string
        data: TaskUpdateData
    }): Promise<TaskEntity | null> {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE tasks
                SET title = :title,
                    description = :description,
                    priority = :priority,
                    assignee_organization_user_id =
                        :assigneeOrganizationUserId,
                    due_at = :dueAt,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING id
            `,
            {
                ...input.data,
                id: input.id,
                organizationId: input.organizationId,
            },
        )
        return rows.length ? this.findById(input) : null
    }

    async move(input: {
        id: string
        organizationId: string
        status: TaskStatus
        position: number
    }): Promise<TaskEntity | null> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const [current] = await databaseClient.select<{
                id: string
                status: TaskStatus
            }>(
                `
                    SELECT id, status
                    FROM tasks
                    WHERE id = :id
                        AND organization_id = :organizationId
                        AND deleted_at IS NULL
                    FOR UPDATE
                `,
                input,
            )
            if (!current) return null

            await databaseClient.select<{ id: string }>(
                `
                    SELECT id
                    FROM tasks
                    WHERE organization_id = :organizationId
                        AND status IN (:sourceStatus, :targetStatus)
                        AND deleted_at IS NULL
                    FOR UPDATE
                `,
                {
                    organizationId: input.organizationId,
                    sourceStatus: current.status,
                    targetStatus: input.status,
                },
            )

            const sourceIds = await this.columnIds(
                databaseClient,
                input.organizationId,
                current.status,
                input.id,
            )
            const targetIds =
                current.status === input.status
                    ? sourceIds
                    : await this.columnIds(
                          databaseClient,
                          input.organizationId,
                          input.status,
                          input.id,
                      )
            const targetPosition = Math.min(input.position, targetIds.length)
            targetIds.splice(targetPosition, 0, input.id)

            if (current.status !== input.status) {
                await this.persistColumn(
                    databaseClient,
                    input.organizationId,
                    current.status,
                    sourceIds,
                )
            }
            await this.persistColumn(
                databaseClient,
                input.organizationId,
                input.status,
                targetIds,
            )

            return this.selectTask(databaseClient, {
                id: input.id,
                organizationId: input.organizationId,
            })
        })
    }

    async softDelete(input: {
        id: string
        organizationId: string
    }): Promise<boolean> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const [task] = await databaseClient.select<{
                id: string
                status: TaskStatus
            }>(
                `
                    SELECT id, status
                    FROM tasks
                    WHERE id = :id
                        AND organization_id = :organizationId
                        AND deleted_at IS NULL
                    FOR UPDATE
                `,
                input,
            )
            if (!task) return false

            await databaseClient.query(
                `
                    UPDATE tasks
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id = :id AND organization_id = :organizationId
                `,
                input,
            )
            const ids = await this.columnIds(
                databaseClient,
                input.organizationId,
                task.status,
                input.id,
            )
            await this.persistColumn(
                databaseClient,
                input.organizationId,
                task.status,
                ids,
            )
            return true
        })
    }

    async isActiveMember(input: {
        organizationId: string
        organizationUserId: string
    }): Promise<boolean> {
        const rows = await this.databaseClient.select<{ id: string }>(
            `
                SELECT organization_users.id
                FROM organization_users
                INNER JOIN users
                    ON users.id = organization_users.user_id
                    AND users.deleted_at IS NULL
                    AND users.status = 'ACTIVE'
                WHERE organization_users.id = :organizationUserId
                    AND organization_users.organization_id = :organizationId
                    AND organization_users.status = 'ACTIVE'
                LIMIT 1
            `,
            input,
        )
        return rows.length > 0
    }

    async createComment(input: {
        organizationId: string
        taskId: string
        authorUserId: string
        content: string
    }): Promise<TaskCommentEntity> {
        const [row] = await this.databaseClient.query<TaskCommentRow>(
            `
                WITH inserted AS (
                    INSERT INTO task_comments (
                        organization_id,
                        task_id,
                        author_user_id,
                        content
                    )
                    VALUES (
                        :organizationId,
                        :taskId,
                        :authorUserId,
                        :content
                    )
                    RETURNING *
                )
                SELECT
                    inserted.*,
                    users.name AS author_name,
                    users.email AS author_email
                FROM inserted
                INNER JOIN users ON users.id = inserted.author_user_id
            `,
            input,
        )
        return this.toComment(row)
    }

    async listComments(input: {
        organizationId: string
        taskId: string
    }): Promise<TaskCommentEntity[]> {
        const rows = await this.databaseClient.select<TaskCommentRow>(
            `
                SELECT
                    comments.*,
                    users.name AS author_name,
                    users.email AS author_email
                FROM task_comments comments
                INNER JOIN users ON users.id = comments.author_user_id
                WHERE comments.organization_id = :organizationId
                    AND comments.task_id = :taskId
                ORDER BY comments.created_at ASC
            `,
            input,
        )
        return rows.map((row) => this.toComment(row))
    }

    private async selectTask(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ): Promise<TaskEntity | null> {
        const [row] = await databaseClient.select<TaskRow>(
            `
                ${taskSelect}
                WHERE tasks.id = :id
                    AND tasks.organization_id = :organizationId
                    AND tasks.deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )
        return row ? this.toTask(row) : null
    }

    private async columnIds(
        databaseClient: DatabaseClient,
        organizationId: string,
        status: TaskStatus,
        excludedId: string,
    ): Promise<string[]> {
        const rows = await databaseClient.select<{ id: string }>(
            `
                SELECT id
                FROM tasks
                WHERE organization_id = :organizationId
                    AND status = :status
                    AND id <> :excludedId
                    AND deleted_at IS NULL
                ORDER BY position, created_at
            `,
            { organizationId, status, excludedId },
        )
        return rows.map((row) => row.id)
    }

    private async persistColumn(
        databaseClient: DatabaseClient,
        organizationId: string,
        status: TaskStatus,
        ids: string[],
    ): Promise<void> {
        for (const [position, id] of ids.entries()) {
            await databaseClient.query(
                `
                    UPDATE tasks
                    SET status = :status,
                        position = :position,
                        completed_at = CASE
                            WHEN :status = 'DONE'
                                THEN COALESCE(completed_at, NOW())
                            ELSE NULL
                        END,
                        updated_at = NOW()
                    WHERE id = :id
                        AND organization_id = :organizationId
                        AND deleted_at IS NULL
                `,
                { id, organizationId, status, position },
            )
        }
    }

    private buildFilters(filters: TaskFilters) {
        const clauses = [
            'tasks.organization_id = :organizationId',
            'tasks.deleted_at IS NULL',
        ]
        const replacements: Record<string, unknown> = {
            organizationId: filters.organizationId,
            now: filters.now,
        }
        const equals: Array<[string, unknown, string]> = [
            ['status', filters.status, 'tasks.status'],
            ['priority', filters.priority, 'tasks.priority'],
            [
                'assigneeOrganizationUserId',
                filters.assigneeOrganizationUserId,
                'tasks.assignee_organization_user_id',
            ],
        ]
        for (const [key, value, column] of equals) {
            if (value !== undefined) {
                clauses.push(`${column} = :${key}`)
                replacements[key] = value
            }
        }
        if (filters.dueFrom) {
            clauses.push('tasks.due_at >= :dueFrom')
            replacements.dueFrom = filters.dueFrom
        }
        if (filters.dueTo) {
            clauses.push('tasks.due_at <= :dueTo')
            replacements.dueTo = filters.dueTo
        }
        if (filters.overdue !== undefined) {
            clauses.push(
                filters.overdue
                    ? "tasks.status <> 'DONE' AND tasks.due_at < :now"
                    : "(tasks.due_at IS NULL OR tasks.status = 'DONE' OR tasks.due_at >= :now)",
            )
        }
        if (filters.search) {
            clauses.push(
                "(tasks.title ILIKE :search OR COALESCE(tasks.description, '') ILIKE :search)",
            )
            replacements.search = `%${filters.search}%`
        }
        return {
            where: `WHERE ${clauses.join('\n AND ')}`,
            replacements,
        }
    }

    private toTask(row: TaskRow): TaskEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            assigneeOrganizationUserId: row.assignee_organization_user_id,
            assignee:
                row.assignee_organization_user_id &&
                row.assignee_user_id &&
                row.assignee_name &&
                row.assignee_email
                    ? {
                          organizationUserId: row.assignee_organization_user_id,
                          userId: row.assignee_user_id,
                          name: row.assignee_name,
                          email: row.assignee_email,
                      }
                    : null,
            createdBy: row.created_by,
            creator: {
                userId: row.created_by,
                name: row.creator_name,
                email: row.creator_email,
            },
            dueAt: row.due_at ? new Date(row.due_at) : null,
            position: Number(row.position),
            completedAt: row.completed_at ? new Date(row.completed_at) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        }
    }

    private toComment(row: TaskCommentRow): TaskCommentEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            taskId: row.task_id,
            authorUserId: row.author_user_id,
            author: {
                userId: row.author_user_id,
                name: row.author_name,
                email: row.author_email,
            },
            content: row.content,
            createdAt: new Date(row.created_at),
        }
    }
}
