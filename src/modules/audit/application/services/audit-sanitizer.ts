const SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /senha/i,
    /hash/i,
    /token/i,
    /secret/i,
    /cookie/i,
    /authorization/i,
    /stripeSecret/i,
    /salary/i,
    /salario/i,
    /compensation/i,
    /amount/i,
    /cpf/i,
    /document/i,
    /phone/i,
    /telefone/i,
]

export function sanitizeAuditPayload(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeAuditPayload(item))
    }

    if (!value || typeof value !== 'object') {
        return value
    }

    return Object.entries(value as Record<string, unknown>).reduce<
        Record<string, unknown>
    >((sanitized, [key, nestedValue]) => {
        sanitized[key] = isSensitiveKey(key)
            ? maskValue(nestedValue)
            : sanitizeAuditPayload(nestedValue)
        return sanitized
    }, {})
}

function isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function maskValue(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null
    }

    return '[REDACTED]'
}
