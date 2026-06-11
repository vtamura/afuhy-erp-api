import express, { type Express } from 'express'
import cors from 'cors'
import type { HttpDependencies } from '../container/container'
import { env } from '../../shared/config/env'

export function createApp(deps: HttpDependencies): Express {
    const app = express()

    app.use(
        cors({
            origin: '*',
        })
    )
    app.use(
        express.json({
            limit: '512mb',
        })
    )

    app.use(env.API_PREFIX, deps.healthRouter)
    app.use(env.API_PREFIX, deps.exampleRouter)

    app.use((_req, res) => {
        return res.status(404).json({ message: 'Não encontrado' })
    })

    return app
}
