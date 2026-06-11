import { BaseError, type ErrorDetails } from './base.error'

export class UnauthorizedError extends BaseError {
  readonly statusCode = 401
  readonly code = 'UNAUTHORIZED'

  constructor(message = 'Não autorizado', details?: ErrorDetails) {
    super(message, details)
  }
}
