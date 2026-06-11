export type AccessControlRequestContext = {
    method: string
    url: string
    system?: string
    version?: string
}

export type CheckPermissionInput = AccessControlRequestContext & {
    userCode: string
}

export type ValidateTokenInput = AccessControlRequestContext & {
    token: string
    feature: string
}

export type AuthenticateUserInput = AccessControlRequestContext & {
    token?: string
    username: string
    password: string
    feature: string
}

export type CheckPermissionResult = {
    allowed: boolean
    attributes?: unknown[]
}

export interface AccessControlPort {
    validateToken(input: ValidateTokenInput): Promise<boolean>
    checkRoutePermission(
        input: CheckPermissionInput,
    ): Promise<CheckPermissionResult>
    authenticateUser(input: AuthenticateUserInput): Promise<boolean>
}
