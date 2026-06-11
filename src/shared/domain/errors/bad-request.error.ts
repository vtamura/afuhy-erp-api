import { BaseError, type ErrorDetails } from './base.error'

export class BadRequestError extends BaseError {
  readonly statusCode = 400
  readonly code = 'BAD_REQUEST'

  constructor(message = 'Requisição inválida', details?: ErrorDetails) {
    super(message, details)
  }
}
