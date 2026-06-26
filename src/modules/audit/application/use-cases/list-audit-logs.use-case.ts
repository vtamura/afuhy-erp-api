import { ForbiddenError } from '../../../../shared/domain/errors'
import type { AuditService } from '../services/audit.service'
import type { AuditLogListResponseDto } from '../dto'
import { toAuditLogListResponseDto } from '../dto'
import type { listAuditLogsSchema } from '../contracts'
import type { z } from 'zod'

type Input = z.infer<typeof listAuditLogsSchema>

export class ListAuditLogsUseCase {
    constructor(private readonly auditService: AuditService) {}

    async execute(input: Input): Promise<AuditLogListResponseDto> {
        const organizationId = input.authUser.organizationId

        if (!organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const result = await this.auditService.list({
            organizationId,
            page: input.page,
            pageSize: input.pageSize,
            module: input.module,
            action: input.action,
            actorType: input.actorType,
            actorUserId: input.actorUserId,
            entityType: input.entityType,
            entityId: input.entityId,
            from: input.from ? new Date(input.from) : undefined,
            to: input.to ? new Date(input.to) : undefined,
            search: input.search,
        })

        await this.auditService.log({
            organizationId,
            requestId: input.requestId ?? null,
            actorType: 'USER',
            actorUserId: input.authUser.userId,
            action: 'READ_SENSITIVE',
            module: 'audit',
            entityType: 'audit_logs',
            entityId: null,
            summary: 'Consulta aos logs de auditoria',
            metadata: {
                filters: {
                    module: input.module,
                    action: input.action,
                    actorType: input.actorType,
                    actorUserId: input.actorUserId,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    from: input.from,
                    to: input.to,
                    search: input.search,
                },
                resultCount: result.items.length,
            },
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
        })

        return toAuditLogListResponseDto(result)
    }
}
