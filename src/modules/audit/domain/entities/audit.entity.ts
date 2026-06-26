export type AuditActorType = 'USER' | 'SYSTEM' | 'STRIPE'

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'RESTORE'
    | 'STATUS_CHANGE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'PERMISSION_CHANGE'
    | 'WEBHOOK_RECEIVED'
    | 'WEBHOOK_PROCESSED'
    | 'READ_SENSITIVE'

export type AuditJson = Record<string, unknown>

export type AuditLogEntity = {
    id: string
    organizationId: string
    requestId: string | null
    actorType: AuditActorType
    actorUserId: string | null
    action: AuditAction
    module: string
    entityType: string
    entityId: string | null
    summary: string
    changes: AuditJson
    metadata: AuditJson
    ipAddress: string | null
    userAgent: string | null
    occurredAt: Date
}

export type AuditLogListResult = {
    items: AuditLogEntity[]
    page: number
    pageSize: number
    total: number
}
