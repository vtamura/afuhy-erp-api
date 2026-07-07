import { env } from '../../config/env'

export function buildEmailTokenUrl(pathname: string, token: string): string {
    const url = new URL(pathname, env.APP_PUBLIC_URL)
    url.searchParams.set('token', token)

    return url.toString()
}
