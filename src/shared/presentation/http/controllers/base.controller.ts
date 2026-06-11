import type { Request, RequestHandler } from 'express'
import { ZodError, type ZodTypeAny, z } from 'zod'
import { BaseError } from '../../../domain/errors'
import { createLogger, serializeError } from '../../../infrastructure/logger/logger'

type HttpResponse<TBody = unknown> = {
    statusCode: number
    body?: TBody
}

export type ControllerInput<TSchema extends ZodTypeAny> = z.infer<TSchema>

export abstract class BaseController<
    TSchema extends ZodTypeAny,
    TOutput = unknown,
> {
    private readonly logger = createLogger({ component: 'controller' })
    protected abstract readonly schema: TSchema

    protected abstract execute(
        input: ControllerInput<TSchema>,
    ): Promise<TOutput | HttpResponse<TOutput> | void>

    public readonly handle: RequestHandler = async (req, res) => {
        const logger = this.logger.child({
            controller: this.constructor.name,
            requestId: req.requestId,
            method: req.method,
            path: req.path,
        })

        try {
            const rawInput = this.buildInput(req)
            const input = this.schema.parse(rawInput)

            const output = await this.execute(input)

            if (output === undefined) {
                return res.status(204).send()
            }

            if (this.isHttpResponse(output)) {
                if (output.body === undefined) {
                    return res.status(output.statusCode).send()
                }

                return res.status(output.statusCode).json(output.body)
            }

            return res.status(200).json(output)
        } catch (error) {
            if (error instanceof BaseError) {
                logger.warn('controller.domain_error', {
                    code: error.code,
                    statusCode: error.statusCode,
                    details: error.details,
                })
                return res.status(error.statusCode).json({
                    code: error.code,
                    message: error.message,
                    details: error.details,
                })
            }

            if (error instanceof ZodError) {
                logger.warn('controller.validation_error', {
                    issues: error.issues,
                })
                return res.status(400).json({
                    code: 'VALIDATION_ERROR',
                    message: 'Falha de validação',
                    details: error.issues,
                })
            }

            logger.error('controller.unhandled_error', {
                error: serializeError(error),
            })
            return res.status(500).json({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro interno do servidor',
            })
        }
    }

    protected buildInput(req: Request): Record<string, unknown> {
        const attributeExpression = this.extractAttributeExpression(
            req.attributes,
        )

        return {
            ...req.params,
            ...req.query,
            ...req.body,
            params: req.params,
            query: req.query,
            body: req.body,
            files: req.files,
            headers: req.headers,
            authUser: req.authUser,
            attributes: req.attributes,
            attributeExpression,
        }
    }

    private extractAttributeExpression(attributes?: unknown[]): string | undefined {
        if (!Array.isArray(attributes) || !attributes.length) {
            return undefined
        }

        const first = attributes[0] as { ATRIBUTOS?: unknown }

        if (typeof first?.ATRIBUTOS !== 'string') {
            return undefined
        }

        const trimmed = first.ATRIBUTOS.trim()

        return trimmed.length ? trimmed : undefined
    }

    private isHttpResponse(value: unknown): value is HttpResponse<TOutput> {
        return (
            typeof value === 'object' &&
            value !== null &&
            'statusCode' in value &&
            typeof (value as { statusCode?: unknown }).statusCode === 'number'
        )
    }
}
