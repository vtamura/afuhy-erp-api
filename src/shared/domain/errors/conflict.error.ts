import { BaseError, type ErrorDetails } from './base.error'

export class ConflictError extends BaseError {
    readonly statusCode = 409
    readonly code = 'CONFLICT'

    constructor(message = 'Conflito', details?: ErrorDetails) {
        super(message, details)
    }
}
