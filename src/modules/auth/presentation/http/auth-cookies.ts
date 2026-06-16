import { env } from '../../../../shared/config/env'
import { parseDurationMs } from '../../infrastructure/security/jwt-token.service'

export const ACCESS_TOKEN_COOKIE_NAME = 'afuhy_access_token'
export const REFRESH_TOKEN_COOKIE_NAME = 'afuhy_refresh_token'

type CookieDefinition = {
    name: string
    value: string
    options: Record<string, unknown>
}

type ClearCookieDefinition = {
    name: string
    options: Record<string, unknown>
}

export function createAuthCookies(tokens: {
    accessToken: string
    refreshToken: string
}): CookieDefinition[] {
    return [
        {
            name: ACCESS_TOKEN_COOKIE_NAME,
            value: tokens.accessToken,
            options: {
                ...baseCookieOptions(),
                path: '/',
                maxAge: parseDurationMs(env.ACCESS_TOKEN_EXPIRES_IN),
            },
        },
        {
            name: REFRESH_TOKEN_COOKIE_NAME,
            value: tokens.refreshToken,
            options: {
                ...baseCookieOptions(),
                path: `${env.API_PREFIX}/auth`,
                maxAge: parseDurationMs(env.REFRESH_TOKEN_EXPIRES_IN),
            },
        },
    ]
}

export function createClearAuthCookies(): ClearCookieDefinition[] {
    return [
        {
            name: ACCESS_TOKEN_COOKIE_NAME,
            options: {
                ...baseCookieOptions(),
                path: '/',
            },
        },
        {
            name: REFRESH_TOKEN_COOKIE_NAME,
            options: {
                ...baseCookieOptions(),
                path: `${env.API_PREFIX}/auth`,
            },
        },
    ]
}

function baseCookieOptions(): Record<string, unknown> {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.AUTH_COOKIE_SECURE,
        domain: env.AUTH_COOKIE_DOMAIN,
    }
}
