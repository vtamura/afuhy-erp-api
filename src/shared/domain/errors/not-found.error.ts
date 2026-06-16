import { BaseError, type ErrorDetails } from './base.error'

export class NotFoundError extends BaseError {
    readonly statusCode = 404
    readonly code = 'NOT_FOUND'

    constructor(message = 'Recurso não encontrado', details?: ErrorDetails) {
        super(message, details)
    }
}
