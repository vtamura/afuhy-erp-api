import crypto from 'node:crypto'

const DEFAULT_TOKEN_BYTES = 32

export class SecureTokenGenerator {
    generate(bytes = DEFAULT_TOKEN_BYTES): string {
        return crypto.randomBytes(bytes).toString('base64url')
    }
}
