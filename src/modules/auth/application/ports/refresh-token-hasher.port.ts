export interface RefreshTokenHasherPort {
    hash(token: string): string
}
