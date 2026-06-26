import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { AuditService } from '../services/audit.service'
import type { AuditLogResponseDto } from '../dto'
import { toAuditLogResponseDto } from '../dto'
import type { getAuditLogSchema } from '../contracts'
import type { z } from 'zod'

type Input = z.infer<typeof getAuditLogSchema>

export class GetAuditLogUseCase {
    constructor(private readonly auditService: AuditService) {}

    async execute(input: Input): Promise<AuditLogResponseDto> {
        const organizationId = input.authUser.organizationId

        if (!organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const log = await this.auditService.get({
            organizationId,
            id: input.id,
        })

        if (!log) {
            throw new NotFoundError('Log de auditoria nao encontrado')
        }

        await this.auditService.log({
            organizationId,
            requestId: input.requestId ?? null,
            actorType: 'USER',
            actorUserId: input.authUser.userId,
            action: 'READ_SENSITIVE',
            module: 'audit',
            entityType: 'audit_log',
            entityId: input.id,
            summary: 'Consulta ao detalhe de log de auditoria',
            metadata: {
                targetLogId: input.id,
            },
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
        })

        return toAuditLogResponseDto(log)
    }
}
