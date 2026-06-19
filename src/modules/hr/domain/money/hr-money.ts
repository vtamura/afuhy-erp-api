function parseCents(value: string): bigint {
    const [integerPart, decimalPart = ''] = value.trim().split('.')
    return BigInt(integerPart) * 100n + BigInt(decimalPart.padEnd(2, '0'))
}

export function normalizeHrMoney(value: string): string {
    const cents = parseCents(value)
    const integerPart = cents / 100n
    const decimalPart = (cents % 100n).toString().padStart(2, '0')
    return `${integerPart}.${decimalPart}`
}
