import type { RequestHandler } from 'express'
import { UnauthorizedError } from '../../../../../shared/domain/errors'
import type { TokenService } from '../../../application/ports/token.service'
import type { UserRepository } from '../../../domain/repositories/user.repository'
import { ACCESS_TOKEN_COOKIE_NAME } from '../auth-cookies'

export function createAuthenticateAccessTokenMiddleware(
    userRepository: UserRepository,
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

            if (!user || !user.isActive) {
                throw new UnauthorizedError('Usuario invalido')
            }

            req.authUser = {
                userId: user.id,
                organizationId: payload.organizationId,
            }

            return next()
        } catch (error) {
            return next(error)
        }
    }
}
