import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type {
    BillingRepository,
    SetOrganizationSubscriptionInput,
} from '../../domain/repositories/billing.repository'
import {
    noopAuditLogger,
    type AuditLogger,
} from '../../../audit/application/services/audit.service'
import type { SubscriptionResponseDto } from '../dto'
import { toSubscriptionResponseDto } from '../mappers/billing-response.mapper'

type SetOrganizationSubscriptionUseCaseInput = {
    organizationId: string
    planCode: SetOrganizationSubscriptionInput['planCode']
    status: SetOrganizationSubscriptionInput['status']
    startsAt?: string
    endsAt?: string | null
    requestId?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    authUser?: {
        userId: string
    }
}

export class SetOrganizationSubscriptionUseCase {
    constructor(
        private readonly billingRepository: BillingRepository,
        private readonly auditLogger: AuditLogger = noopAuditLogger,
    ) {}

    async execute(
        input: SetOrganizationSubscriptionUseCaseInput,
    ): Promise<SubscriptionResponseDto> {
        const plan = await this.billingRepository.findPlanByCode(input.planCode)

        if (!plan) {
            throw new NotFoundError('Plano nao encontrado')
        }

        const currentSubscription =
            await this.billingRepository.findCurrentSubscriptionByOrganization(
                input.organizationId,
            )

        if (currentSubscription?.source === 'STRIPE') {
            throw new ConflictError(
                'Assinatura Stripe ativa nao pode ser sobrescrita manualmente',
            )
        }

        const subscription =
            await this.billingRepository.setCurrentSubscription({
                organizationId: input.organizationId,
                planCode: input.planCode,
                status: input.status,
                startsAt: input.startsAt
                    ? new Date(input.startsAt)
                    : new Date(),
                endsAt: input.endsAt ? new Date(input.endsAt) : null,
            })

        await this.auditLogger.log({
            organizationId: input.organizationId,
            requestId: input.requestId ?? null,
            actorType: 'USER',
            actorUserId: input.authUser?.userId ?? null,
            action: 'STATUS_CHANGE',
            module: 'billing',
            entityType: 'subscription',
            entityId: subscription.id,
            summary: 'Assinatura manual definida',
            changes: {
                before: currentSubscription
                    ? {
                          id: currentSubscription.id,
                          planCode: currentSubscription.plan.code,
                          status: currentSubscription.status,
                          source: currentSubscription.source,
                      }
                    : null,
                after: {
                    id: subscription.id,
                    planCode: subscription.plan.code,
                    status: subscription.status,
                    source: subscription.source,
                },
            },
            metadata: {
                planCode: input.planCode,
            },
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null,
        })

        return toSubscriptionResponseDto(subscription)
    }
}
