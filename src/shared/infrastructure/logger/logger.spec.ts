import fs from 'node:fs'
import path from 'node:path'

import { createLogger, serializeError } from './logger'

describe('logger', () => {
    const fixedDate = new Date('2026-07-08T12:34:56.789Z')
    const logsDirectory = path.resolve(process.cwd(), 'logs')

    let appendFileSpy: jest.SpiedFunction<typeof fs.appendFileSync>
    let mkdirSpy: jest.SpiedFunction<typeof fs.mkdirSync>
    let consoleLogSpy: jest.SpiedFunction<typeof console.log>
    let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>
    let consoleErrorSpy: jest.SpiedFunction<typeof console.error>

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(fixedDate)

        process.env.LOG_LEVEL = 'debug'

        appendFileSpy = jest
            .spyOn(fs, 'appendFileSync')
            .mockImplementation(() => undefined)
        mkdirSpy = jest
            .spyOn(fs, 'mkdirSync')
            .mockImplementation(() => undefined)
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    })

    afterEach(() => {
        delete process.env.LOG_LEVEL
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    it('writes jsonl files grouped by day and level', () => {
        const logger = createLogger({ component: 'test' })

        logger.info('info.message', { requestId: 'req-1' })
        logger.warn('warn.message')
        logger.error('error.message')
        logger.debug('debug.message')

        expect(appendFileSpy).toHaveBeenCalledWith(
            path.join(logsDirectory, '2026-07-08', 'info.jsonl'),
            expect.stringMatching(/\n$/),
            'utf8',
        )
        expect(appendFileSpy).toHaveBeenCalledWith(
            path.join(logsDirectory, '2026-07-08', 'warn.jsonl'),
            expect.stringMatching(/\n$/),
            'utf8',
        )
        expect(appendFileSpy).toHaveBeenCalledWith(
            path.join(logsDirectory, '2026-07-08', 'error.jsonl'),
            expect.stringMatching(/\n$/),
            'utf8',
        )
        expect(appendFileSpy).toHaveBeenCalledWith(
            path.join(logsDirectory, '2026-07-08', 'debug.jsonl'),
            expect.stringMatching(/\n$/),
            'utf8',
        )

        expect(mkdirSpy).toHaveBeenCalledWith(
            path.join(logsDirectory, '2026-07-08'),
            { recursive: true },
        )
    })

    it('writes one valid json object per line', () => {
        const logger = createLogger({ component: 'test' })

        logger.info('event.created', { entityId: 'entity-1' })

        const [, contents] = appendFileSpy.mock.calls[0]
        const parsed = JSON.parse(String(contents).trim())

        expect(parsed).toEqual({
            timestamp: fixedDate.toISOString(),
            level: 'info',
            message: 'event.created',
            component: 'test',
            entityId: 'entity-1',
        })
        expect(consoleLogSpy).toHaveBeenCalledWith(String(contents).trim())
    })

    it('respects LOG_LEVEL before writing to console or file', () => {
        process.env.LOG_LEVEL = 'warn'
        const logger = createLogger()

        logger.debug('debug.message')
        logger.info('info.message')
        logger.warn('warn.message')
        logger.error('error.message')

        expect(appendFileSpy).toHaveBeenCalledTimes(2)
        expect(consoleLogSpy).not.toHaveBeenCalled()
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('merges child logger context with local context', () => {
        const logger = createLogger({
            component: 'parent',
            tenantId: 'tenant-1',
        })
        const child = logger.child({ component: 'child', requestId: 'req-1' })

        child.info('child.event', { userId: 'user-1' })

        const [, contents] = appendFileSpy.mock.calls[0]
        const parsed = JSON.parse(String(contents).trim())

        expect(parsed).toMatchObject({
            component: 'child',
            tenantId: 'tenant-1',
            requestId: 'req-1',
            userId: 'user-1',
        })
    })

    it('logs a fallback error when file writing fails', () => {
        const writeError = new Error('disk full')
        appendFileSpy.mockImplementation(() => {
            throw writeError
        })

        createLogger().error('event.failed')

        expect(consoleErrorSpy).toHaveBeenCalledTimes(2)

        const fallbackPayload = JSON.parse(
            String(consoleErrorSpy.mock.calls[1][0]),
        )

        expect(fallbackPayload).toMatchObject({
            timestamp: fixedDate.toISOString(),
            level: 'error',
            message: 'logger.file_write_failed',
            target: path.join(logsDirectory, '2026-07-08', 'error.jsonl'),
            error: {
                name: writeError.name,
                message: writeError.message,
                stack: writeError.stack,
            },
        })
    })

    it('serializes errors, bigint values, and circular references safely', () => {
        const circular: Record<string, unknown> = { name: 'root' }
        circular.self = circular
        const error = new Error('boom')

        createLogger().info('safe.context', {
            error,
            amount: 10n,
            circular,
        })

        const [, contents] = appendFileSpy.mock.calls[0]
        const parsed = JSON.parse(String(contents).trim())

        expect(parsed.error).toMatchObject({
            name: error.name,
            message: error.message,
            stack: error.stack,
        })
        expect(parsed.amount).toBe('10')
        expect(parsed.circular).toEqual({
            name: 'root',
            self: '[Circular]',
        })
    })

    it('emits a minimal payload when serialization fails', () => {
        createLogger().info('unsafe.context', {
            unsafe: {
                toJSON() {
                    throw new Error('toJSON failed')
                },
            },
        })

        const [, contents] = appendFileSpy.mock.calls[0]
        const parsed = JSON.parse(String(contents).trim())

        expect(parsed).toMatchObject({
            timestamp: fixedDate.toISOString(),
            level: 'error',
            message: 'logger.serialization_failed',
            error: {
                name: 'Error',
                message: 'toJSON failed',
            },
        })
    })

    it('keeps serializeError behavior for Error instances', () => {
        const error = new Error('serialize me')

        expect(serializeError(error)).toEqual({
            name: error.name,
            message: error.message,
            stack: error.stack,
        })
    })
})
