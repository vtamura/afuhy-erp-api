import bcrypt from 'bcrypt'
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port'

const SALT_ROUNDS = 12

export class BcryptPasswordHasher implements PasswordHasherPort {
    hash(plainText: string): Promise<string> {
        return bcrypt.hash(plainText, SALT_ROUNDS)
    }

    compare(plainText: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainText, hash)
    }
}
