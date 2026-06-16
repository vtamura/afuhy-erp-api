export type ErrorDetails = unknown

export abstract class BaseError extends Error {
    abstract readonly statusCode: number
    abstract readonly code: string

    readonly details?: ErrorDetails

    protected constructor(message: string, details?: ErrorDetails) {
        super(message)
        this.name = new.target.name
        this.details = details

        Object.setPrototypeOf(this, new.target.prototype)
        Error.captureStackTrace?.(this, new.target)
    }
}
