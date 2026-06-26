import type {
    AuditJson,
    AuditLogEntity,
    AuditLogListResult,
} from '../../domain/entities/audit.entity'

export type AuditLogResponseDto = {
    id: string
    organizationId: string
    requestId: string | null
    actorType: string
    actorUserId: string | null
    action: string
    module: string
    entityType: string
    entityId: string | null
    summary: string
    changes: AuditJson
    metadata: AuditJson
    ipAddress: string | null
    userAgent: string | null
    occurredAt: string
}

export type AuditLogListResponseDto = {
    items: AuditLogResponseDto[]
    page: number
    pageSize: number
    total: number
}

export function toAuditLogResponseDto(
    entity: AuditLogEntity,
): AuditLogResponseDto {
    return {
        id: entity.id,
        organizationId: entity.organizationId,
        requestId: entity.requestId,
        actorType: entity.actorType,
        actorUserId: entity.actorUserId,
        action: entity.action,
        module: entity.module,
        entityType: entity.entityType,
        entityId: entity.entityId,
        summary: entity.summary,
        changes: entity.changes,
        metadata: entity.metadata,
        ipAddress: entity.ipAddress,
        userAgent: entity.userAgent,
        occurredAt: entity.occurredAt.toISOString(),
    }
}

export function toAuditLogListResponseDto(
    result: AuditLogListResult,
): AuditLogListResponseDto {
    return {
        items: result.items.map(toAuditLogResponseDto),
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
    }
}
