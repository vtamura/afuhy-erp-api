import type { RequestHandler } from 'express'
import { UnauthorizedError } from '../../../../../shared/domain/errors'
import type { TokenService } from '../../../application/ports/token.service'
import type { SessionRepository } from '../../../domain/repositories/session.repository'
import type { UserRepository } from '../../../domain/repositories/user.repository'
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth-cookies'

export function createAuthenticateAccessTokenMiddleware(
    userRepository: UserRepository,
    sessionRepository: SessionRepository,
    tokenService: TokenService,
): RequestHandler {
    return async (req, _res, next) => {
        try {
            const token = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME]

            if (!token) {
                throw new UnauthorizedError('Access token ausente')
            }

            const payload = tokenService.verifyAccessToken(token)
            const user = await userRepository.findById(payload.sub)
            const session = await sessionRepository.findById(payload.sessionId)

            if (!user || !user.isActive) {
                throw new UnauthorizedError('Usuario invalido')
            }

            if (!session || !session.isActive || session.userId !== user.id) {
                throw new UnauthorizedError('Sessao invalida')
            }

            req.authUser = {
                userId: user.id,
                sessionId: session.id,
                organizationId: payload.organizationId,
            }

            return next()
        } catch (error) {
            return next(error)
        }
    }
}
