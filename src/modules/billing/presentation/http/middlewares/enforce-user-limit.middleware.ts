import type { RequestHandler } from 'express'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import type { BillingRepository } from '../../../domain/repositories/billing.repository'

type EnforceUserLimitOptions = {
    organizationIdParam?: string
}

export function createEnforceUserLimitMiddleware(
    billingRepository: BillingRepository,
) {
    return (
            options: EnforceUserLimitOptions = { organizationIdParam: 'id' },
        ): RequestHandler =>
        async (req, _res, next) => {
            try {
                const routeOrganizationId = options.organizationIdParam
                    ? req.params[options.organizationIdParam]
                    : undefined
                const organizationId =
                    routeOrganizationId ?? req.authUser?.organizationId

                if (!organizationId) {
                    throw new ForbiddenError('Organizacao nao selecionada')
                }

                const subscription =
                    await billingRepository.findCurrentSubscriptionByOrganization(
                        organizationId,
                    )

                if (
                    !subscription ||
                    !['ACTIVE', 'TRIALING'].includes(subscription.status)
                ) {
                    throw new ForbiddenError('Assinatura ativa obrigatoria')
                }

                const usedSeats =
                    await billingRepository.countUsedSeats(organizationId)

                if (usedSeats >= subscription.seatLimit) {
                    throw new ForbiddenError(
                        'Limite de usuarios do plano atingido',
                    )
                }

                return next()
            } catch (error) {
                return next(error)
            }
        }
}
