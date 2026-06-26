import type {
    AuditLogEntity,
    AuditLogListResult,
} from '../../domain/entities/audit.entity'
import type {
    AuditLogQuery,
    AuditRepository,
    CreateAuditLogInput,
} from '../../domain/repositories/audit.repository'
import { sanitizeAuditPayload } from './audit-sanitizer'

export type AuditLogger = {
    log(input: CreateAuditLogInput): Promise<void>
}

export class AuditService implements AuditLogger {
    constructor(private readonly auditRepository: AuditRepository) {}

    async log(input: CreateAuditLogInput): Promise<void> {
        await this.auditRepository.create(this.sanitizeInput(input))
    }

    list(query: AuditLogQuery): Promise<AuditLogListResult> {
        return this.auditRepository.list(query)
    }

    get(input: {
        organizationId: string
        id: string
    }): Promise<AuditLogEntity | null> {
        return this.auditRepository.findById(input)
    }

    private sanitizeInput(input: CreateAuditLogInput): CreateAuditLogInput {
        return {
            ...input,
            changes: sanitizeAuditPayload(input.changes ?? {}) as Record<
                string,
                unknown
            >,
            metadata: sanitizeAuditPayload(input.metadata ?? {}) as Record<
                string,
                unknown
            >,
        }
    }
}

export const noopAuditLogger: AuditLogger = {
    async log() {
        return undefined
    },
}
