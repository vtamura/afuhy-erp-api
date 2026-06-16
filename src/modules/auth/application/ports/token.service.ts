export type TokenType = 'access' | 'refresh'

export type AuthTokenPayload = {
    type: TokenType
    sub: string
    sessionId: string
    organizationId: string | null
}

export interface TokenService {
    signAccessToken(payload: Omit<AuthTokenPayload, 'type'>): string
    signRefreshToken(payload: Omit<AuthTokenPayload, 'type'>): string
    verifyAccessToken(token: string): AuthTokenPayload
    verifyRefreshToken(token: string): AuthTokenPayload
    getAccessTokenExpiresAt(): Date
    getRefreshTokenExpiresAt(): Date
}
