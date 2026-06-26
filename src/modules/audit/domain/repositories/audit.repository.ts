import type {
    AuditAction,
    AuditActorType,
    AuditJson,
    AuditLogEntity,
    AuditLogListResult,
} from '../entities/audit.entity'

export type CreateAuditLogInput = {
    organizationId: string
    requestId?: string | null
    actorType: AuditActorType
    actorUserId?: string | null
    action: AuditAction
    module: string
    entityType: string
    entityId?: string | null
    summary: string
    changes?: AuditJson
    metadata?: AuditJson
    ipAddress?: string | null
    userAgent?: string | null
    occurredAt?: Date
}

export type AuditLogQuery = {
    organizationId: string
    page: number
    pageSize: number
    module?: string
    action?: AuditAction
    actorType?: AuditActorType
    actorUserId?: string
    entityType?: string
    entityId?: string
    from?: Date
    to?: Date
    search?: string
}

export interface AuditRepository {
    create(input: CreateAuditLogInput): Promise<AuditLogEntity>
    list(query: AuditLogQuery): Promise<AuditLogListResult>
    findById(input: {
        organizationId: string
        id: string
    }): Promise<AuditLogEntity | null>
}
