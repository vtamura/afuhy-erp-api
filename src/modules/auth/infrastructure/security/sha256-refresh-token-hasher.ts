import { createHash } from 'node:crypto'
import type { RefreshTokenHasherPort } from '../../application/ports/refresh-token-hasher.port'

export class Sha256RefreshTokenHasher implements RefreshTokenHasherPort {
    hash(token: string): string {
        return createHash('sha256').update(token).digest('hex')
    }
}
