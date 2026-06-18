export function moneyToCents(value: string): bigint {
    const normalized = value.trim()
    const negative = normalized.startsWith('-')
    const unsigned = negative ? normalized.slice(1) : normalized
    const [integerPart, decimalPart = ''] = unsigned.split('.')
    const cents =
        BigInt(integerPart) * 100n + BigInt(decimalPart.padEnd(2, '0'))

    return negative ? -cents : cents
}

export function centsToMoney(value: bigint): string {
    const negative = value < 0n
    const absolute = negative ? -value : value
    const integerPart = absolute / 100n
    const decimalPart = (absolute % 100n).toString().padStart(2, '0')

    return `${negative ? '-' : ''}${integerPart}.${decimalPart}`
}

export function normalizeMoney(value: string): string {
    return centsToMoney(moneyToCents(value))
}
