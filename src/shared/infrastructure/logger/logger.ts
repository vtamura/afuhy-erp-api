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
const LOGS_DIRECTORY = path.resolve(process.cwd(), 'logs')
const CIRCULAR_REFERENCE_MARKER = '[Circular]'

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

    const serialized = stringifyLogPayload(payload)

    if (level === 'error') {
        console.error(serialized)
    } else if (level === 'warn') {
        console.warn(serialized)
    } else {
        console.log(serialized)
    }

    writeLogFile(level, payload.timestamp, serialized)
}

function stringifyLogPayload(payload: Record<string, unknown>): string {
    try {
        return JSON.stringify(payload, createJsonReplacer())
    } catch (error) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'logger.serialization_failed',
            error: toErrorObject(error),
        })
    }
}

function createJsonReplacer(): (key: string, value: unknown) => unknown {
    const seen = new WeakSet<object>()

    return (_key, value) => {
        if (value instanceof Error) {
            return toErrorObject(value)
        }

        if (typeof value === 'bigint') {
            return value.toString()
        }

        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return CIRCULAR_REFERENCE_MARKER
            }

            seen.add(value)
        }

        return value
    }
}

function getLogFilePath(level: LogLevel, timestamp: string): string {
    const logDate = timestamp.slice(0, 10)

    return path.join(LOGS_DIRECTORY, logDate, `${level}.jsonl`)
}

function writeLogFile(
    level: LogLevel,
    timestamp: string,
    serialized: string,
): void {
    const target = getLogFilePath(level, timestamp)

    try {
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.appendFileSync(target, `${serialized}\n`, 'utf8')
    } catch (error) {
        console.error(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'logger.file_write_failed',
                target,
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
