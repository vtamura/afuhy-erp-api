import { authOpenApiDocument } from '../../modules/auth/presentation/http/docs/auth.openapi'
import { exampleOpenApiDocument } from '../../modules/example/presentation/http/docs/example.openapi'
import type { OpenApiModuleDocument } from './openapi.types'

const moduleDocuments: OpenApiModuleDocument[] = [
    authOpenApiDocument,
    exampleOpenApiDocument,
]

export function createOpenApiDocument() {
    return {
        openapi: '3.0.3',
        info: {
            title: 'Afuhy API',
            description: 'Documentacao da API do mini-ERP Afuhy.',
            version: '1.0.0',
        },
        tags: moduleDocuments.flatMap((document) => document.tags ?? []),
        servers: [
            {
                url: '/api',
                description: 'API base path',
            },
        ],
        components: {
            securitySchemes: {
                accessTokenCookie: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'afuhy_access_token',
                    description: 'Access token JWT em cookie httpOnly.',
                },
                refreshTokenCookie: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'afuhy_refresh_token',
                    description: 'Refresh token JWT em cookie httpOnly.',
                },
            },
            schemas: moduleDocuments.reduce<Record<string, unknown>>(
                (schemas, document) => ({
                    ...schemas,
                    ...(document.schemas ?? {}),
                }),
                {},
            ),
        },
        paths: moduleDocuments.reduce<Record<string, unknown>>(
            (paths, document) => ({
                ...paths,
                ...(document.paths ?? {}),
            }),
            {},
        ),
    }
}
