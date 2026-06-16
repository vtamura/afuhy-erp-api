import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { env } from '../../../../shared/config/env'
import { UnauthorizedError } from '../../../../shared/domain/errors'
import type {
    AuthTokenPayload,
    TokenService,
} from '../../application/ports/token.service'

export class JwtTokenService implements TokenService {
    signAccessToken(payload: Omit<AuthTokenPayload, 'type'>): string {
        return jwt.sign(
            { ...payload, type: 'access' },
            env.ACCESS_TOKEN_SECRET,
            {
                expiresIn:
                    env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
            },
        )
    }

    signRefreshToken(payload: Omit<AuthTokenPayload, 'type'>): string {
        return jwt.sign(
            { ...payload, type: 'refresh' },
            env.REFRESH_TOKEN_SECRET,
            {
                expiresIn:
                    env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
            },
        )
    }

    verifyAccessToken(token: string): AuthTokenPayload {
        return this.verifyToken(token, env.ACCESS_TOKEN_SECRET, 'access')
    }

    verifyRefreshToken(token: string): AuthTokenPayload {
        return this.verifyToken(token, env.REFRESH_TOKEN_SECRET, 'refresh')
    }

    getAccessTokenExpiresAt(): Date {
        return new Date(
            Date.now() + parseDurationMs(env.ACCESS_TOKEN_EXPIRES_IN),
        )
    }

    getRefreshTokenExpiresAt(): Date {
        return new Date(
            Date.now() + parseDurationMs(env.REFRESH_TOKEN_EXPIRES_IN),
        )
    }

    private verifyToken(
        token: string,
        secret: string,
        expectedType: AuthTokenPayload['type'],
    ): AuthTokenPayload {
        try {
            const payload = jwt.verify(
                token,
                secret,
            ) as Partial<AuthTokenPayload>

            if (
                payload.type !== expectedType ||
                typeof payload.sub !== 'string' ||
                typeof payload.sessionId !== 'string'
            ) {
                throw new UnauthorizedError('Token invalido')
            }

            return {
                type: payload.type,
                sub: payload.sub,
                sessionId: payload.sessionId,
                organizationId: payload.organizationId ?? null,
            }
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error
            }

            throw new UnauthorizedError('Token invalido')
        }
    }
}

export function parseDurationMs(value: string): number {
    const match = value.trim().match(/^(\d+)(ms|s|m|h|d)?$/)

    if (!match) {
        return 15 * 60 * 1000
    }

    const amount = Number(match[1])
    const unit = match[2] ?? 'ms'

    const multipliers: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    }

    return amount * multipliers[unit]
}
