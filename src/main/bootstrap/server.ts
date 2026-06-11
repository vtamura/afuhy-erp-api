import { createHttpDependencies } from '../container/container'
import { createApp } from '../http/create-app'
import { env } from '../../shared/config/env'
import { createLogger, serializeError } from '../../shared/infrastructure/logger/logger'

const logger = createLogger({ component: 'bootstrap' })

function bootstrap(): void {
    process.on('unhandledRejection', (reason) => {
        logger.error('process.unhandled_rejection', {
            error: serializeError(reason),
        })
    })

    process.on('uncaughtException', (error) => {
        logger.error('process.uncaught_exception', {
            error: serializeError(error),
        })
    })

    const deps = createHttpDependencies()
    const app = createApp(deps)

    app.listen(env.PORT, () => {
        logger.info('server.started', {
            port: env.PORT,
            apiPrefix: env.API_PREFIX,
            nodeEnv: env.NODE_ENV,
        })
    })
}

bootstrap()
