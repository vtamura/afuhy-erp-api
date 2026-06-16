import type { AuthUser } from '../../../application/contracts'

export {}

declare global {
    namespace Express {
        interface Request {
            attributes?: unknown[]
            authUser?: AuthUser
            cookies?: Record<string, string | undefined>
            requestId?: string
        }
    }
}
