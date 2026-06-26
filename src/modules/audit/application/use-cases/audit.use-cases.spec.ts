import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type { AuditLogEntity } from '../../domain/entities/audit.entity'
import type { AuditRepository } from '../../domain/repositories/audit.repository'
import { AuditService } from '../services/audit.service'
import { sanitizeAuditPayload } from '../services/audit-sanitizer'
import { GetAuditLogUseCase } from './get-audit-log.use-case'
import { ListAuditLogsUseCase } from './list-audit-logs.use-case'

describe('Audit use cases', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'
    const userId = '4c8617da-e7e6-4ac3-98ef-72a152fe6bd8'
    const requestId = '0a1e2559-bc27-49ef-ae75-44f0f3466766'

    const authUser = {
        userId,
        sessionId: 'b3961db9-63a2-4811-a9cb-f2f9227e2585',
        organizationId,
    }

    function makeLog(overrides: Partial<AuditLogEntity> = {}): AuditLogEntity {
        return {
            id: '62c04547-6874-4c5e-94ab-81f4cd31bc22',
            organizationId,
            requestId,
            actorType: 'USER',
            actorUserId: userId,
            action: 'UPDATE',
            module: 'billing',
            entityType: 'subscription',
            entityId: 'sub_123',
            summary: 'Assinatura alterada',
            changes: {},
            metadata: {},
            ipAddress: '127.0.0.1',
            userAgent: 'jest',
            occurredAt: now,
            ...overrides,
        }
    }

    function makeRepository(): jest.Mocked<AuditRepository> {
        return {
            create: jest.fn(async (input) =>
                makeLog({
                    organizationId: input.organizationId,
                    requestId: input.requestId ?? null,
                    actorType: input.actorType,
                    actorUserId: input.actorUserId ?? null,
                    action: input.action,
                    module: input.module,
                    entityType: input.entityType,
                    entityId: input.entityId ?? null,
                    summary: input.summary,
                    changes: input.changes ?? {},
                    metadata: input.metadata ?? {},
                    ipAddress: input.ipAddress ?? null,
                    userAgent: input.userAgent ?? null,
                }),
            ),
            list: jest.fn().mockResolvedValue({
                items: [makeLog()],
                page: 1,
                pageSize: 20,
                total: 1,
            }),
            findById: jest.fn().mockResolvedValue(makeLog()),
        }
    }

    it('sanitizes sensitive payload fields', () => {
        const sanitized = sanitizeAuditPayload({
            email: 'user@example.com',
            cpf: '12345678900',
            password: 'secret',
            nested: {
                stripeSecretKey: 'fake-secret',
                visible: 'ok',
            },
        })

        expect(sanitized).toEqual({
            email: 'user@example.com',
            cpf: '[REDACTED]',
            password: '[REDACTED]',
            nested: {
                stripeSecretKey: '[REDACTED]',
                visible: 'ok',
            },
        })
    })

    it('creates sanitized audit events', async () => {
        const repository = makeRepository()
        const service = new AuditService(repository)

        await service.log({
            organizationId,
            actorType: 'SYSTEM',
            action: 'WEBHOOK_PROCESSED',
            module: 'billing',
            entityType: 'subscription',
            summary: 'Webhook processado',
            metadata: {
                stripeSecretKey: 'fake-secret',
                stripeEventId: 'evt_123',
            },
        })

        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                actorType: 'SYSTEM',
                metadata: {
                    stripeSecretKey: '[REDACTED]',
                    stripeEventId: 'evt_123',
                },
            }),
        )
    })

    it('lists logs and audits the sensitive read', async () => {
        const repository = makeRepository()
        const useCase = new ListAuditLogsUseCase(new AuditService(repository))

        const result = await useCase.execute({
            authUser,
            requestId,
            page: 1,
            pageSize: 20,
            module: 'billing',
        })

        expect(repository.list).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId,
                module: 'billing',
                page: 1,
                pageSize: 20,
            }),
        )
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'READ_SENSITIVE',
                module: 'audit',
                entityType: 'audit_logs',
            }),
        )
        expect(result.total).toBe(1)
    })

    it('rejects list without selected organization', async () => {
        const useCase = new ListAuditLogsUseCase(
            new AuditService(makeRepository()),
        )

        await expect(
            useCase.execute({
                authUser: { ...authUser, organizationId: null },
                page: 1,
                pageSize: 20,
            }),
        ).rejects.toBeInstanceOf(ForbiddenError)
    })

    it('gets a log detail and audits the sensitive read', async () => {
        const repository = makeRepository()
        const useCase = new GetAuditLogUseCase(new AuditService(repository))

        const result = await useCase.execute({
            id: '62c04547-6874-4c5e-94ab-81f4cd31bc22',
            authUser,
            requestId,
        })

        expect(repository.findById).toHaveBeenCalledWith({
            organizationId,
            id: '62c04547-6874-4c5e-94ab-81f4cd31bc22',
        })
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'READ_SENSITIVE',
                entityType: 'audit_log',
            }),
        )
        expect(result.id).toBe('62c04547-6874-4c5e-94ab-81f4cd31bc22')
    })

    it('throws when log detail does not exist', async () => {
        const repository = makeRepository()
        repository.findById.mockResolvedValueOnce(null)
        const useCase = new GetAuditLogUseCase(new AuditService(repository))

        await expect(
            useCase.execute({
                id: '62c04547-6874-4c5e-94ab-81f4cd31bc22',
                authUser,
            }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })
})
