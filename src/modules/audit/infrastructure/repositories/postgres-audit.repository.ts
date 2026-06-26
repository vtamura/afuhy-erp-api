import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    AuditAction,
    AuditActorType,
    AuditJson,
    AuditLogEntity,
    AuditLogListResult,
} from '../../domain/entities/audit.entity'
import type {
    AuditLogQuery,
    AuditRepository,
    CreateAuditLogInput,
} from '../../domain/repositories/audit.repository'

type AuditLogRow = {
    id: string
    organization_id: string
    request_id: string | null
    actor_type: AuditActorType
    actor_user_id: string | null
    action: AuditAction
    module: string
    entity_type: string
    entity_id: string | null
    summary: string
    changes: AuditJson | null
    metadata: AuditJson | null
    ip_address: string | null
    user_agent: string | null
    occurred_at: Date
}

export class PostgresAuditRepository implements AuditRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(input: CreateAuditLogInput): Promise<AuditLogEntity> {
        const [row] = await this.databaseClient.query<AuditLogRow>(
            `
                INSERT INTO audit_logs (
                    organization_id,
                    request_id,
                    actor_type,
                    actor_user_id,
                    action,
                    module,
                    entity_type,
                    entity_id,
                    summary,
                    changes,
                    metadata,
                    ip_address,
                    user_agent,
                    occurred_at
                )
                VALUES (
                    :organizationId,
                    :requestId,
                    :actorType,
                    :actorUserId,
                    :action,
                    :module,
                    :entityType,
                    :entityId,
                    :summary,
                    CAST(:changes AS JSONB),
                    CAST(:metadata AS JSONB),
                    :ipAddress,
                    :userAgent,
                    COALESCE(:occurredAt, NOW())
                )
                RETURNING *
            `,
            {
                organizationId: input.organizationId,
                requestId: input.requestId ?? null,
                actorType: input.actorType,
                actorUserId: input.actorUserId ?? null,
                action: input.action,
                module: input.module,
                entityType: input.entityType,
                entityId: input.entityId ?? null,
                summary: input.summary,
                changes: JSON.stringify(input.changes ?? {}),
                metadata: JSON.stringify(input.metadata ?? {}),
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
                occurredAt: input.occurredAt ?? null,
            },
        )

        return this.toEntity(row)
    }

    async list(query: AuditLogQuery): Promise<AuditLogListResult> {
        const where = ['organization_id = :organizationId']
        const replacements: Record<string, unknown> = {
            organizationId: query.organizationId,
            limit: query.pageSize,
            offset: (query.page - 1) * query.pageSize,
        }

        this.addOptionalFilters(where, replacements, query)

        const whereSql = where.join(' AND ')
        const [countRow] = await this.databaseClient.select<{ total: string }>(
            `
                SELECT COUNT(*)::TEXT AS total
                FROM audit_logs
                WHERE ${whereSql}
            `,
            replacements,
        )
        const rows = await this.databaseClient.select<AuditLogRow>(
            `
                SELECT *
                FROM audit_logs
                WHERE ${whereSql}
                ORDER BY occurred_at DESC, id DESC
                LIMIT :limit
                OFFSET :offset
            `,
            replacements,
        )

        return {
            items: rows.map((row) => this.toEntity(row)),
            page: query.page,
            pageSize: query.pageSize,
            total: Number(countRow?.total ?? 0),
        }
    }

    async findById(input: {
        organizationId: string
        id: string
    }): Promise<AuditLogEntity | null> {
        const [row] = await this.databaseClient.select<AuditLogRow>(
            `
                SELECT *
                FROM audit_logs
                WHERE organization_id = :organizationId
                    AND id = :id
                LIMIT 1
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    private addOptionalFilters(
        where: string[],
        replacements: Record<string, unknown>,
        query: AuditLogQuery,
    ): void {
        if (query.module) {
            where.push('module = :module')
            replacements.module = query.module
        }

        if (query.action) {
            where.push('action = :action')
            replacements.action = query.action
        }

        if (query.actorType) {
            where.push('actor_type = :actorType')
            replacements.actorType = query.actorType
        }

        if (query.actorUserId) {
            where.push('actor_user_id = :actorUserId')
            replacements.actorUserId = query.actorUserId
        }

        if (query.entityType) {
            where.push('entity_type = :entityType')
            replacements.entityType = query.entityType
        }

        if (query.entityId) {
            where.push('entity_id = :entityId')
            replacements.entityId = query.entityId
        }

        if (query.from) {
            where.push('occurred_at >= :from')
            replacements.from = query.from
        }

        if (query.to) {
            where.push('occurred_at <= :to')
            replacements.to = query.to
        }

        if (query.search) {
            where.push(
                '(summary ILIKE :search OR module ILIKE :search OR entity_type ILIKE :search OR entity_id ILIKE :search)',
            )
            replacements.search = `%${query.search}%`
        }
    }

    private toEntity(row: AuditLogRow): AuditLogEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            requestId: row.request_id,
            actorType: row.actor_type,
            actorUserId: row.actor_user_id,
            action: row.action,
            module: row.module,
            entityType: row.entity_type,
            entityId: row.entity_id,
            summary: row.summary,
            changes: row.changes ?? {},
            metadata: row.metadata ?? {},
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            occurredAt: new Date(row.occurred_at),
        }
    }
}
