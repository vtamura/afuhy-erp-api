import { BaseError, type ErrorDetails } from './base.error'

export class ForbiddenError extends BaseError {
  readonly statusCode = 403
  readonly code = 'FORBIDDEN'

  constructor(message = 'Proibido', details?: ErrorDetails) {
    super(message, details)
  }
}
