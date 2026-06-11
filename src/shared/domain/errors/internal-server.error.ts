import { BaseError, type ErrorDetails } from './base.error'

export class InternalServerError extends BaseError {
  readonly statusCode = 500
  readonly code = 'INTERNAL_SERVER_ERROR'

  constructor(message = 'Erro interno do servidor', details?: ErrorDetails) {
    super(message, details)
  }
}
