import fs from 'node:fs'
import path from 'node:path'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
}

type LoggerContext = Record<string, unknown>
const DEFAULT_LOG_PATH = path.resolve(__dirname, '../../../../default.log')

function parseLogLevel(value: string | undefined): LogLevel {
    if (!value) {
        return 'error'
    }

    const normalized = value.toLowerCase()

    if (
        normalized === 'debug' ||
        normalized === 'info' ||
        normalized === 'warn' ||
        normalized === 'error'
    ) {
        return normalized
    }

    return 'error'
}

function toErrorObject(error: unknown): Record<string, unknown> {
    if (!(error instanceof Error)) {
        return { value: error }
    }

    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
    }
}

function isAllowed(level: LogLevel): boolean {
    const configured = parseLogLevel(process.env.LOG_LEVEL)
    return LOG_LEVEL_WEIGHT[level] >= LOG_LEVEL_WEIGHT[configured]
}

function write(level: LogLevel, message: string, context: LoggerContext): void {
    if (!isAllowed(level)) {
        return
    }

    const payload = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
    }

    const serialized = JSON.stringify(payload)

    if (level === 'error') {
        console.error(serialized)
    } else if (level === 'warn') {
        console.warn(serialized)
    } else {
        console.log(serialized)
    }

    if (shouldWriteToDefaultLog(level)) {
        writeDefaultLogFile(serialized)
    }
}

function shouldWriteToDefaultLog(level: LogLevel): boolean {
    if (level === 'error') {
        return true
    }

    return process.env.NODE_ENV === 'development'
}

function writeDefaultLogFile(serialized: string): void {
    try {
        fs.appendFileSync(DEFAULT_LOG_PATH, `${serialized}\n`, 'utf8')
    } catch (error) {
        console.error(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'logger.file_write_failed',
                target: DEFAULT_LOG_PATH,
                error: toErrorObject(error),
            }),
        )
    }
}

export type Logger = {
    debug(message: string, context?: LoggerContext): void
    info(message: string, context?: LoggerContext): void
    warn(message: string, context?: LoggerContext): void
    error(message: string, context?: LoggerContext): void
    child(context: LoggerContext): Logger
}

export function createLogger(baseContext: LoggerContext = {}): Logger {
    const withContext = (context?: LoggerContext): LoggerContext => ({
        ...baseContext,
        ...(context ?? {}),
    })

    return {
        debug(message, context) {
            write('debug', message, withContext(context))
        },
        info(message, context) {
            write('info', message, withContext(context))
        },
        warn(message, context) {
            write('warn', message, withContext(context))
        },
        error(message, context) {
            write('error', message, withContext(context))
        },
        child(context) {
            return createLogger(withContext(context))
        },
    }
}

export function serializeError(error: unknown): Record<string, unknown> {
    return toErrorObject(error)
}
