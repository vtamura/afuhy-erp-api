export type EmailJobInput<TPayload = Record<string, unknown>> = {
    template: string
    to: string
    subject: string
    payload: TPayload
    idempotencyKey?: string
}

export type EmailQueuePort = {
    enqueue(input: EmailJobInput): Promise<void>
}
