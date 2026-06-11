declare module 'express' {
    export type AuthUserLike = {
        userId: number | string
        companyId?: number | string
    }

    export interface Request {
        params: Record<string, string>
        query: Record<string, unknown>
        body: Record<string, unknown>
        headers: Record<string, string | string[] | undefined>
        method: string
        path: string
        url: string
        attributes?: unknown[]
        authUser?: AuthUserLike
        files?: unknown[]
        requestId?: string
    }

    export interface Response {
        statusCode: number
        status(code: number): Response
        json(body: unknown): Response
        send(body?: unknown): Response
        end(body?: unknown): Response
        setHeader(key: string, value: string): Response
        on(event: string, listener: () => void): Response
    }

    export type NextFunction = (error?: unknown) => void

    export type RequestHandler = (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => unknown

    export interface Router {
        get(path: string, ...handlers: RequestHandler[]): Router
        post(path: string, ...handlers: RequestHandler[]): Router
        put(path: string, ...handlers: RequestHandler[]): Router
        patch(path: string, ...handlers: RequestHandler[]): Router
        delete(path: string, ...handlers: RequestHandler[]): Router
        use(...handlers: Array<RequestHandler | Router | string>): Router
    }

    export interface Express extends Router {
        listen(port: number, callback?: () => void): void
    }

    export interface JsonOptions {
        limit?: string | number
    }

    export interface CorsOptions {
        origin?: string | boolean | RegExp | Array<string | RegExp>
    }

    export function Router(): Router

    export interface ExpressFactory {
        (): Express
        json(options?: JsonOptions): RequestHandler
    }

    const express: ExpressFactory

    export default express
}

declare module 'multer' {
    type MulterInstance = {
        array(fieldName: string, maxCount?: number): import('express').RequestHandler
        any(): import('express').RequestHandler
    }

    type MulterOptions = {
        storage?: unknown
    }

    export interface MulterFactory {
        (options?: MulterOptions): MulterInstance
        memoryStorage(): unknown
    }

    const multer: MulterFactory

    export default multer
}
