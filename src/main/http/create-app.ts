import express, {
    type Express,
    type NextFunction,
    type Request,
    type RequestHandler,
    type Response,
} from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import type { HttpDependencies } from '../container/container'
import { registerSwagger } from '../docs/register-swagger'
import { env } from '../../shared/config/env'
import { BaseError } from '../../shared/domain/errors'
import {
    createLogger,
    serializeError,
} from '../../shared/infrastructure/logger/logger'

const logger = createLogger({ component: 'http' })
const rawBodyParser = (
    express as unknown as {
        raw: (options: { type: string }) => RequestHandler
    }
).raw

export function createApp(deps: HttpDependencies): Express {
    const app = express()

    app.use(
        cors({
            origin: env.CORS_ORIGIN,
            credentials: true,
        }),
    )
    app.use(cookieParser())
    app.use(
        `${env.API_PREFIX}/billing/stripe/webhook`,
        rawBodyParser({ type: 'application/json' }),
        deps.stripeWebhookRouter,
    )
    app.use(
        express.json({
            limit: '512mb',
        }),
    )

    app.use(env.API_PREFIX, deps.healthRouter)
    app.use(env.API_PREFIX, deps.exampleRouter)
    app.use(env.API_PREFIX, deps.authRouter)
    app.use(env.API_PREFIX, deps.organizationsRouter)
    app.use(env.API_PREFIX, deps.usersRouter)
    app.use(env.API_PREFIX, deps.billingRouter)
    app.use(env.API_PREFIX, deps.registryRouter)
    app.use(env.API_PREFIX, deps.financialRouter)
    app.use(env.API_PREFIX, deps.tasksRouter)
    app.use(env.API_PREFIX, deps.inventoryRouter)
    app.use(env.API_PREFIX, deps.hrRouter)
    app.use(env.API_PREFIX, deps.loansRouter)
    app.use(env.API_PREFIX, deps.reportsRouter)

    registerSwagger(app)

    app.use((_req: Request, res: Response) => {
        return res.status(404).json({ message: 'Nao encontrado' })
    })

    app.use(
        (error: unknown, req: Request, res: Response, _next: NextFunction) => {
            if (error instanceof BaseError) {
                logger.warn('http.domain_error', {
                    requestId: req.requestId,
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

            logger.error('http.unhandled_error', {
                requestId: req.requestId,
                error: serializeError(error),
            })

            return res.status(500).json({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro interno do servidor',
            })
        },
    )

    return app
}
