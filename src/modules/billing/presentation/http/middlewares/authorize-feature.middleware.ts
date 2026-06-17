import type { RequestHandler } from 'express'
import { ForbiddenError } from '../../../../../shared/domain/errors'
import type { BillingRepository } from '../../../domain/repositories/billing.repository'

export function createAuthorizeFeatureMiddleware(
    billingRepository: BillingRepository,
) {
    return (featureCode: string): RequestHandler =>
        async (req, _res, next) => {
            try {
                const organizationId = req.authUser?.organizationId

                if (!organizationId) {
                    throw new ForbiddenError('Organizacao nao selecionada')
                }

                const hasFeature =
                    await billingRepository.organizationHasFeature({
                        organizationId,
                        featureCode,
                    })

                if (!hasFeature) {
                    throw new ForbiddenError('Feature nao disponivel no plano')
                }

                return next()
            } catch (error) {
                return next(error)
            }
        }
}
