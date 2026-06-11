import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'
import { createLogger } from '../../../infrastructure/logger/logger'

const logger = createLogger({ component: 'http' })

export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
    const headerId = req.headers['x-request-id']
    const requestId =
        typeof headerId === 'string' && headerId.trim().length > 0
            ? headerId
            : randomUUID()

    req.requestId = requestId
    res.setHeader('x-request-id', requestId)

    const startedAt = Date.now()

    logger.info('request.started', {
        requestId,
        method: req.method,
        path: req.path,
    })

    res.on('finish', () => {
        logger.info('request.finished', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
        })
    })

    next()
}
