import type { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import { env } from '../../shared/config/env'
import { createOpenApiDocument } from './openapi'

export function registerSwagger(app: Express): void {
    const openApiDocument = createOpenApiDocument()
    const docsPath = `${env.API_PREFIX}/docs`
    const docsJsonPath = `${env.API_PREFIX}/docs.json`

    app.get(docsJsonPath, (_req, res) => {
        return res.status(200).json(openApiDocument)
    })

    app.use(docsPath, ...swaggerUi.serve, swaggerUi.setup(openApiDocument))
}
