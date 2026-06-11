import type { Request, RequestHandler } from 'express'
import type { AccessControlPort } from '../../../application/ports/access-control.port'
import {
    getUserCompanyIdFromToken,
    getUserIdFromToken,
} from '../../../utils/jwt'
import {
    createLogger,
    serializeError,
} from '../../../infrastructure/logger/logger'

const logger = createLogger({ component: 'access-control-middleware' })

function getHeader(req: Request, name: string): string | undefined {
    const value = req.headers[name]
    return typeof value === 'string' ? value : undefined
}

function getRequiredToken(req: Request): string {
    const token = getHeader(req, 'x-access-token')

    if (!token) {
        throw new Error('Cabecalho x-access-token ausente')
    }

    return token
}

export function createValidateTokenMiddleware(
    accessControl: AccessControlPort
): RequestHandler {
    return async (req, res, next) => {
        try {
            const token = getRequiredToken(req)

            const isValid = await accessControl.validateToken({
                token,
                method: req.method,
                url: req.url,
                feature: req.url,
                system: getHeader(req, 'x-sistema'),
                version: getHeader(req, 'x-versao'),
            })

            if (!isValid) {
                return res.status(401).json({
                    status: 401,
                    message: 'token expirado',
                })
            }

            return next()
        } catch (error) {
            logger.warn('validate_token.failed', {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                error: serializeError(error),
            })
            return res.status(401).json({
                status: 401,
                message: 'token expirado',
            })
        }
    }
}

export function createCheckPermissionMiddleware(
    accessControl: AccessControlPort
): RequestHandler {
    return async (req, res, next) => {
        try {
            const token = getRequiredToken(req)
            const userId = getUserIdFromToken(token)

            if (process.env.NODE_ENV === 'development') {
                return next()
            }

            const permission = await accessControl.checkRoutePermission({
                userCode: String(userId),
                method: req.method,
                url: req.url,
                system: getHeader(req, 'x-sistema'),
                version: getHeader(req, 'x-versao'),
            })

            if (!permission.allowed) {
                return res.status(403).json({
                    status: 403,
                    message: 'Você não tem permissão para acessar este recurso',
                })
            }

            req.attributes = permission.attributes ?? []
            return next()
        } catch (error) {
            logger.warn('check_permission.failed', {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                error: serializeError(error),
            })
            return res.status(403).json({
                status: 403,
                message: 'Você não tem permissão para acessar este recurso',
            })
        }
    }
}

export const attachUserFromTokenMiddleware: RequestHandler = (
    req,
    _res,
    next
) => {
    try {
        const token = getRequiredToken(req)
        const userId = getUserIdFromToken(token)
        const companyId = getUserCompanyIdFromToken(token)

        req.authUser = { userId, companyId }

        return next()
    } catch (error) {
        logger.warn('attach_user_from_token.failed', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            error: serializeError(error),
        })
        return next()
    }
}

export function createAuthenticateUserMiddleware(
    accessControl: AccessControlPort
): RequestHandler {
    return async (req, res, next) => {
        try {
            const username =
                typeof req.body?.username === 'string' ? req.body.username : ''
            const password =
                typeof req.body?.password === 'string' ? req.body.password : ''

            const normalizedUsername = username.includes('@')
                ? username.split('@')[0]
                : username

            if (!normalizedUsername || !password) {
                return res.status(400).json({
                    status: 400,
                    message: 'Credenciais inválidas',
                })
            }

            const authenticated = await accessControl.authenticateUser({
                token: getHeader(req, 'x-access-token'),
                username: normalizedUsername,
                password,
                method: req.method,
                url: req.url,
                feature: req.url,
                system: getHeader(req, 'x-sistema'),
                version: getHeader(req, 'x-versao'),
            })

            if (!authenticated) {
                return res.status(401).json({
                    status: 401,
                    message: 'Falha na autenticação',
                })
            }

            return next()
        } catch (error) {
            logger.warn('authenticate_user.failed', {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                error: serializeError(error),
            })
            return res.status(401).json({
                status: 401,
                message: 'Falha na autenticação',
            })
        }
    }
}
