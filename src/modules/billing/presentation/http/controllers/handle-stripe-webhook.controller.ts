import type { RequestHandler } from 'express'
import { BaseError } from '../../../../../shared/domain/errors'
import {
    createLogger,
    serializeError,
} from '../../../../../shared/infrastructure/logger/logger'
import type { HandleStripeWebhookUseCase } from '../../../application/use-cases'

export class HandleStripeWebhookController {
    private readonly logger = createLogger({
        component: 'stripe-webhook-controller',
    })

    constructor(
        private readonly handleStripeWebhookUseCase: HandleStripeWebhookUseCase,
    ) {}

    public readonly handle: RequestHandler = async (req, res) => {
        try {
            const signature = req.headers['stripe-signature']
            const payload = Buffer.isBuffer(req.body)
                ? req.body
                : Buffer.from(JSON.stringify(req.body ?? {}))

            await this.handleStripeWebhookUseCase.execute({
                payload,
                signature: Array.isArray(signature) ? signature[0] : signature,
            })

            return res.status(200).json({ received: true })
        } catch (error) {
            if (error instanceof BaseError) {
                this.logger.warn('stripe_webhook.domain_error', {
                    code: error.code,
                    statusCode: error.statusCode,
                    details: error.details,
                })

                return res.status(error.statusCode).json({
                    code: error.code,
                    message: error.message,
                    details: error.details,
                })
            }

            this.logger.error('stripe_webhook.unhandled_error', {
                error: serializeError(error),
            })

            return res.status(500).json({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro interno do servidor',
            })
        }
    }
}
