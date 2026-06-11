export type TokenPayload = {
    user?: {
        userId?: number
        companyId?: string | number
    }
}

type LegacyTokenPayload = {
    usuario?: {
        cod_usuario?: number
        cod_filial?: string | number
    }
}

function decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const paddingLength = (4 - (normalized.length % 4)) % 4
    const withPadding = normalized + '='.repeat(paddingLength)

    return Buffer.from(withPadding, 'base64').toString('utf-8')
}

export function decodeJwtPayload<T>(token: string): T {
    const parts = token.split('.')

    if (parts.length !== 3) {
        throw new Error('Formato de token JWT inválido')
    }

    const payload = decodeBase64Url(parts[1])
    return JSON.parse(payload) as T
}

export function getUserIdFromToken(token: string): number {
    const payload = decodeJwtPayload<TokenPayload & LegacyTokenPayload>(token)

    const userId = payload.user?.userId ?? payload.usuario?.cod_usuario

    if (!userId) {
        throw new Error('Payload do token inválido: id do usuário não encontrado')
    }

    return userId
}

export function getUserCompanyIdFromToken(token: string): string | undefined {
    const payload = decodeJwtPayload<TokenPayload & LegacyTokenPayload>(token)

    const companyId = payload.user?.companyId ?? payload.usuario?.cod_filial

    if (companyId === undefined || companyId === null) {
        return undefined
    }

    const normalized = String(companyId).trim()

    return normalized.length ? normalized : undefined
}
