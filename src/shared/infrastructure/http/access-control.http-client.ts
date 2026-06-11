import { env } from '../../config/env'
import type {
    AccessControlPort,
    AuthenticateUserInput,
    CheckPermissionInput,
    CheckPermissionResult,
    ValidateTokenInput,
} from '../../application/ports/access-control.port'
import {
    getDatabaseClient,
    type DatabaseClient,
} from '../database/sequelize.client'

type RolePermissionRow = {
    hasAdm: number | null
    hasTester: number | null
}

const ADM_POLICY_ID = 12087
const TESTER_POLICY_ID = 12088

export class AccessControlHttpClient implements AccessControlPort {
    private readonly baseUrl?: string
    private readonly databaseClient: DatabaseClient

    constructor(
        databaseClient: DatabaseClient = getDatabaseClient(),
        apiAccess = env.API_ACCESS
    ) {
        this.databaseClient = databaseClient
        this.baseUrl = apiAccess
            ? apiAccess.startsWith('http')
                ? apiAccess
                : `https://${apiAccess}`
            : undefined
    }

    async validateToken(input: ValidateTokenInput): Promise<boolean> {
        if (!this.baseUrl) {
            return false
        }

        const response = await this.post('/tokenvalidation', {
            'x-access-token': input.token,
            'x-sistema': input.system,
            'x-versao': input.version,
            'x-acao': input.method,
            'x-funcionalidade': input.feature,
        })

        return response.ok
    }

    async checkRoutePermission(
        input: CheckPermissionInput
    ): Promise<CheckPermissionResult> {
        const query = /*sql*/ `
            SELECT
                MAX(CASE WHEN PF.cod_politica_configuracao = :admPolicyId THEN 1 ELSE 0 END) AS hasAdm,
                MAX(CASE WHEN PF.cod_politica_configuracao = :testerPolicyId THEN 1 ELSE 0 END) AS hasTester
            FROM ${env.DB_BACCESS_SCHEMA}.DIM_PERFIL PF
            INNER JOIN ${env.DB_BACCESS_SCHEMA}.DIM_USUARIO U
                ON U.cod_usuario = PF.cod_usuario
                AND IFNULL(U.D_E_L_E_T_, '') = ''
            WHERE U.cod_usuario = :userCode
                AND PF.cod_politica_configuracao IN (:admPolicyId, :testerPolicyId)
                AND PF.D_E_L_E_T_ IS NULL
        `
        const [permissionRow] =
            await this.databaseClient.select<RolePermissionRow>(query, {
                userCode: Number(input.userCode),
                admPolicyId: ADM_POLICY_ID,
                testerPolicyId: TESTER_POLICY_ID,
            })

        const hasAdm = Number(permissionRow?.hasAdm ?? 0) === 1
        const hasTester = Number(permissionRow?.hasTester ?? 0) === 1

        if (hasAdm) {
            return { allowed: true, attributes: ['ADM'] }
        }

        if (hasTester && this.isTesterRouteAllowed(input)) {
            return { allowed: true, attributes: ['TESTER'] }
        }

        return { allowed: false }
    }

    async authenticateUser(input: AuthenticateUserInput): Promise<boolean> {
        if (!this.baseUrl) {
            return false
        }

        const response = await this.post(
            '/perfil/usuario',
            {
                'x-access-token': input.token,
                'x-sistema': input.system,
                'x-versao': input.version,
                'x-acao': input.method,
                'x-funcionalidade': input.feature,
            },
            {
                usuario: input.username,
                senha: input.password,
            }
        )

        return response.ok
    }

    private isTesterRouteAllowed(input: CheckPermissionInput): boolean {
        const normalizedMethod = input.method.toUpperCase()
        const normalizedUrl = this.normalizeUrlPath(input.url)

        const allowedRoutes: Array<{
            methods: string[]
            pattern: RegExp
        }> = [
            { methods: ['GET'], pattern: /^\/home$/ },
            { methods: ['GET'], pattern: /^\/users$/ },
            { methods: ['GET'], pattern: /^\/systems$/ },
            { methods: ['GET'], pattern: /^\/releases$/ },
            { methods: ['GET'], pattern: /^\/test-cases$/ },
            { methods: ['GET'], pattern: /^\/test-cases\/\d+\/steps$/ },
            { methods: ['GET'], pattern: /^\/test-plans$/ },
            { methods: ['GET'], pattern: /^\/test-plans\/\d+\/items$/ },
            {
                methods: ['GET', 'POST'],
                pattern: /^\/test-plan-items\/\d+\/executions$/,
            },
            {
                methods: ['PATCH', 'DELETE'],
                pattern: /^\/test-executions\/\d+$/,
            },
            {
                methods: ['GET', 'POST', 'PATCH', 'DELETE'],
                pattern: /^\/attachments(?:\/\d+)?$/,
            },
            {
                methods: ['GET', 'POST'],
                pattern: /^\/test-executions\/\d+\/attachments$/,
            },
        ]

        return allowedRoutes.some(
            (route) =>
                route.methods.includes(normalizedMethod) &&
                route.pattern.test(normalizedUrl)
        )
    }

    private normalizeUrlPath(url: string): string {
        const [path] = url.split('?')
        return path || '/'
    }

    private async post(
        path: string,
        headers: Record<string, string | undefined>,
        body?: unknown
    ): Promise<Response> {
        if (!this.baseUrl) {
            throw new Error('Cliente de controle de acesso não configurado')
        }

        return fetch(new URL(path, this.baseUrl), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...Object.fromEntries(
                    Object.entries(headers).filter(([, value]) =>
                        Boolean(value)
                    )
                ),
            },
            body: body ? JSON.stringify(body) : undefined,
        })
    }
}
