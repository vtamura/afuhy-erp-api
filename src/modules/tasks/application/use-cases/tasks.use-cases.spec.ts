import { NotFoundError } from '../../../../shared/domain/errors'
import type {
    TaskCommentEntity,
    TaskEntity,
    TaskPriority,
    TaskStatus,
} from '../../domain/entities/task.entity'
import type {
    TaskCreateData,
    TaskFilters,
    TaskRepository,
    TaskUpdateData,
} from '../../domain/repositories/task.repository'
import {
    CreateTaskCommentUseCase,
    CreateTaskUseCase,
    DeleteTaskUseCase,
    GetTaskUseCase,
    ListTaskBoardUseCase,
    ListTaskCommentsUseCase,
    ListTasksUseCase,
    MoveTaskUseCase,
    UpdateTaskUseCase,
} from '.'

const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'
const otherOrganizationId = '77a4cace-b14f-4a0d-b7fa-406be4b139cc'
const userId = '3ccbcefd-b996-4362-94bb-46955de8813e'
const memberId = 'ae3ab197-55ce-46c8-91f2-37b1b78160f2'
const clock = { now: () => new Date('2026-06-18T12:00:00.000Z') }

class InMemoryTaskRepository implements TaskRepository {
    tasks: TaskEntity[] = []
    comments: TaskCommentEntity[] = []
    activeMembers = new Set([`${organizationId}:${memberId}`])

    async create(data: TaskCreateData): Promise<TaskEntity> {
        const now = clock.now()
        const task: TaskEntity = {
            id: `task-${this.tasks.length + 1}`,
            ...data,
            assignee: data.assigneeOrganizationUserId
                ? this.member(data.assigneeOrganizationUserId)
                : null,
            creator: this.user(data.createdBy),
            position: this.activeTasks(data.organizationId).filter(
                (candidate) => candidate.status === data.status,
            ).length,
            completedAt: data.status === 'DONE' ? now : null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }
        this.tasks.push(task)
        return task
    }

    async list(
        filters: TaskFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const filtered = this.activeTasks(filters.organizationId)
            .filter((task) => {
                if (filters.status && task.status !== filters.status)
                    return false
                if (filters.priority && task.priority !== filters.priority)
                    return false
                if (
                    filters.assigneeOrganizationUserId &&
                    task.assigneeOrganizationUserId !==
                        filters.assigneeOrganizationUserId
                )
                    return false
                if (
                    filters.dueFrom &&
                    (!task.dueAt || task.dueAt < filters.dueFrom)
                )
                    return false
                if (
                    filters.dueTo &&
                    (!task.dueAt || task.dueAt > filters.dueTo)
                )
                    return false
                const overdue =
                    task.status !== 'DONE' &&
                    task.dueAt !== null &&
                    task.dueAt < filters.now
                if (
                    filters.overdue !== undefined &&
                    overdue !== filters.overdue
                )
                    return false
                if (
                    filters.search &&
                    !`${task.title} ${task.description ?? ''}`
                        .toLowerCase()
                        .includes(filters.search.toLowerCase())
                )
                    return false
                return true
            })
            .sort((a, b) => a.position - b.position)
        const offset = (pagination.page - 1) * pagination.pageSize
        return {
            items: filtered.slice(offset, offset + pagination.pageSize),
            total: filtered.length,
        }
    }

    async listBoard(inputOrganizationId: string) {
        return this.activeTasks(inputOrganizationId).sort(
            (a, b) => a.position - b.position,
        )
    }

    async findById(input: { id: string; organizationId: string }) {
        return (
            this.activeTasks(input.organizationId).find(
                (task) => task.id === input.id,
            ) ?? null
        )
    }

    async update(input: {
        id: string
        organizationId: string
        data: TaskUpdateData
    }) {
        const task = await this.findById(input)
        if (!task) return null
        Object.assign(task, input.data, {
            assignee: input.data.assigneeOrganizationUserId
                ? this.member(input.data.assigneeOrganizationUserId)
                : null,
            updatedAt: clock.now(),
        })
        return task
    }

    async move(input: {
        id: string
        organizationId: string
        status: TaskStatus
        position: number
    }) {
        const task = await this.findById(input)
        if (!task) return null
        const sourceStatus = task.status
        const source = this.column(input.organizationId, sourceStatus).filter(
            (candidate) => candidate.id !== task.id,
        )
        const target =
            sourceStatus === input.status
                ? source
                : this.column(input.organizationId, input.status).filter(
                      (candidate) => candidate.id !== task.id,
                  )
        target.splice(Math.min(input.position, target.length), 0, task)
        if (sourceStatus !== input.status) this.persist(sourceStatus, source)
        task.status = input.status
        task.completedAt =
            input.status === 'DONE' ? (task.completedAt ?? clock.now()) : null
        this.persist(input.status, target)
        return task
    }

    async softDelete(input: { id: string; organizationId: string }) {
        const task = await this.findById(input)
        if (!task) return false
        task.deletedAt = clock.now()
        this.persist(
            task.status,
            this.column(input.organizationId, task.status),
        )
        return true
    }

    async isActiveMember(input: {
        organizationId: string
        organizationUserId: string
    }) {
        return this.activeMembers.has(
            `${input.organizationId}:${input.organizationUserId}`,
        )
    }

    async createComment(input: {
        organizationId: string
        taskId: string
        authorUserId: string
        content: string
    }) {
        const comment: TaskCommentEntity = {
            id: `comment-${this.comments.length + 1}`,
            ...input,
            author: this.user(input.authorUserId),
            createdAt: clock.now(),
        }
        this.comments.push(comment)
        return comment
    }

    async listComments(input: { organizationId: string; taskId: string }) {
        return this.comments.filter(
            (comment) =>
                comment.organizationId === input.organizationId &&
                comment.taskId === input.taskId,
        )
    }

    private activeTasks(inputOrganizationId: string) {
        return this.tasks.filter(
            (task) =>
                task.organizationId === inputOrganizationId && !task.deletedAt,
        )
    }

    private column(inputOrganizationId: string, status: TaskStatus) {
        return this.activeTasks(inputOrganizationId)
            .filter((task) => task.status === status)
            .sort((a, b) => a.position - b.position)
    }

    private persist(status: TaskStatus, tasks: TaskEntity[]) {
        tasks.forEach((task, position) => {
            task.status = status
            task.position = position
            task.completedAt =
                status === 'DONE' ? (task.completedAt ?? clock.now()) : null
            task.updatedAt = clock.now()
        })
    }

    private user(id: string) {
        return { userId: id, name: 'Afuhy User', email: 'user@afuhy.com.br' }
    }

    private member(id: string) {
        return {
            organizationUserId: id,
            ...this.user(userId),
        }
    }
}

function createInput(
    overrides: Partial<{
        organizationId: string
        title: string
        description: string | null
        status: TaskStatus
        priority: TaskPriority
        assigneeOrganizationUserId: string | null
        dueAt: Date | null
    }> = {},
) {
    return {
        organizationId,
        title: 'Preparar proposta',
        description: null,
        status: 'BACKLOG' as TaskStatus,
        priority: 'MEDIUM' as TaskPriority,
        assigneeOrganizationUserId: null,
        createdBy: userId,
        dueAt: null,
        ...overrides,
    }
}

describe('Tasks use cases', () => {
    it('creates tasks at the end of the selected column', async () => {
        const repository = new InMemoryTaskRepository()
        const useCase = new CreateTaskUseCase(repository, clock)
        const first = await useCase.execute(createInput())
        const second = await useCase.execute(createInput({ title: 'Second' }))

        expect(first.position).toBe(0)
        expect(second.position).toBe(1)
        expect(second.status).toBe('BACKLOG')
    })

    it('isolates tenants, filters and paginates tasks', async () => {
        const repository = new InMemoryTaskRepository()
        const create = new CreateTaskUseCase(repository, clock)
        await create.execute(
            createInput({ title: 'Urgent item', priority: 'URGENT' }),
        )
        await create.execute(createInput({ title: 'Other item' }))
        await create.execute(
            createInput({
                organizationId: otherOrganizationId,
                title: 'Other tenant',
                priority: 'URGENT',
            }),
        )

        const result = await new ListTasksUseCase(repository, clock).execute({
            organizationId,
            priority: 'URGENT',
            search: 'urgent',
            page: 1,
            pageSize: 1,
        })

        expect(result.items).toHaveLength(1)
        expect(result.items[0].title).toBe('Urgent item')
        expect(result.pagination.total).toBe(1)
    })

    it('requires an active assignee from the organization', async () => {
        const repository = new InMemoryTaskRepository()
        const create = new CreateTaskUseCase(repository, clock)

        await expect(
            create.execute(
                createInput({
                    assigneeOrganizationUserId:
                        '00000000-0000-4000-8000-000000000001',
                }),
            ),
        ).rejects.toBeInstanceOf(NotFoundError)

        await expect(
            create.execute(
                createInput({ assigneeOrganizationUserId: memberId }),
            ),
        ).resolves.toMatchObject({
            assigneeOrganizationUserId: memberId,
        })
    })

    it('updates editable fields without changing workflow state', async () => {
        const repository = new InMemoryTaskRepository()
        const created = await new CreateTaskUseCase(repository, clock).execute(
            createInput(),
        )
        const updated = await new UpdateTaskUseCase(repository, clock).execute({
            id: created.id,
            organizationId,
            title: 'Updated title',
            priority: 'HIGH',
            assigneeOrganizationUserId: memberId,
        })

        expect(updated).toMatchObject({
            title: 'Updated title',
            priority: 'HIGH',
            status: 'BACKLOG',
            position: 0,
        })
    })

    it('reorders tasks in the same column and between columns', async () => {
        const repository = new InMemoryTaskRepository()
        const create = new CreateTaskUseCase(repository, clock)
        const first = await create.execute(createInput({ title: 'First' }))
        const second = await create.execute(createInput({ title: 'Second' }))
        const move = new MoveTaskUseCase(repository, clock)

        await move.execute({
            id: second.id,
            organizationId,
            status: 'BACKLOG',
            position: 0,
        })
        expect(
            repository.tasks.find((task) => task.id === second.id)?.position,
        ).toBe(0)
        expect(
            repository.tasks.find((task) => task.id === first.id)?.position,
        ).toBe(1)

        const done = await move.execute({
            id: second.id,
            organizationId,
            status: 'DONE',
            position: 0,
        })
        expect(done.completedAt).not.toBeNull()

        const reopened = await move.execute({
            id: second.id,
            organizationId,
            status: 'TODO',
            position: 0,
        })
        expect(reopened.completedAt).toBeNull()
    })

    it('returns a four-column ordered board', async () => {
        const repository = new InMemoryTaskRepository()
        const create = new CreateTaskUseCase(repository, clock)
        const first = await create.execute(createInput({ title: 'First' }))
        const second = await create.execute(createInput({ title: 'Second' }))
        await new MoveTaskUseCase(repository, clock).execute({
            id: second.id,
            organizationId,
            status: 'BACKLOG',
            position: 0,
        })

        const board = await new ListTaskBoardUseCase(repository, clock).execute(
            { organizationId },
        )

        expect(board.columns.map((column) => column.status)).toEqual([
            'BACKLOG',
            'TODO',
            'IN_PROGRESS',
            'DONE',
        ])
        expect(board.columns[0].items.map((task) => task.id)).toEqual([
            second.id,
            first.id,
        ])
    })

    it('marks overdue tasks and filters them', async () => {
        const repository = new InMemoryTaskRepository()
        await new CreateTaskUseCase(repository, clock).execute(
            createInput({ dueAt: new Date('2026-06-17T12:00:00.000Z') }),
        )
        const result = await new ListTasksUseCase(repository, clock).execute({
            organizationId,
            overdue: true,
            page: 1,
            pageSize: 20,
        })

        expect(result.items).toHaveLength(1)
        expect(result.items[0].isOverdue).toBe(true)
    })

    it('soft deletes tasks and prevents cross-tenant access', async () => {
        const repository = new InMemoryTaskRepository()
        const created = await new CreateTaskUseCase(repository, clock).execute(
            createInput(),
        )
        const get = new GetTaskUseCase(repository, clock)

        await expect(
            get.execute({
                id: created.id,
                organizationId: otherOrganizationId,
            }),
        ).rejects.toBeInstanceOf(NotFoundError)
        await new DeleteTaskUseCase(repository).execute({
            id: created.id,
            organizationId,
        })
        await expect(
            get.execute({ id: created.id, organizationId }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('creates and lists immutable task comments', async () => {
        const repository = new InMemoryTaskRepository()
        const task = await new CreateTaskUseCase(repository, clock).execute(
            createInput(),
        )
        const created = await new CreateTaskCommentUseCase(repository).execute({
            id: task.id,
            organizationId,
            authorUserId: userId,
            content: 'Comentario inicial',
        })
        const comments = await new ListTaskCommentsUseCase(repository).execute({
            id: task.id,
            organizationId,
        })

        expect(created.author.userId).toBe(userId)
        expect(comments).toHaveLength(1)
        expect(comments[0].content).toBe('Comentario inicial')
    })
})
