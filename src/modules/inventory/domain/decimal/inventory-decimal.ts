function parseScaled(value: string, scale: number): bigint {
    const normalized = value.trim()
    const negative = normalized.startsWith('-')
    const unsigned = negative ? normalized.slice(1) : normalized
    const [integerPart, decimalPart = ''] = unsigned.split('.')
    const result =
        BigInt(integerPart) * 10n ** BigInt(scale) +
        BigInt(decimalPart.padEnd(scale, '0').slice(0, scale))
    return negative ? -result : result
}

function formatScaled(value: bigint, scale: number): string {
    const negative = value < 0n
    const absolute = negative ? -value : value
    const divisor = 10n ** BigInt(scale)
    const integerPart = absolute / divisor
    const decimalPart = (absolute % divisor).toString().padStart(scale, '0')
    return `${negative ? '-' : ''}${integerPart}.${decimalPart}`
}

export const quantityToMillis = (value: string) => parseScaled(value, 3)
export const millisToQuantity = (value: bigint) => formatScaled(value, 3)
export const moneyToCents = (value: string) => parseScaled(value, 2)
export const centsToMoney = (value: bigint) => formatScaled(value, 2)
export const normalizeQuantity = (value: string) =>
    millisToQuantity(quantityToMillis(value))
export const normalizeInventoryMoney = (value: string) =>
    centsToMoney(moneyToCents(value))

export function calculateTotalCost(quantity: string, unitCost: string): string {
    const quantityMillis = quantityToMillis(quantity)
    const unitCostCents = moneyToCents(unitCost)
    const roundedCents = (quantityMillis * unitCostCents + 500n) / 1000n
    return centsToMoney(roundedCents < 0n ? -roundedCents : roundedCents)
}

export function calculateAverageCost(input: {
    currentQuantity: string
    currentAverageCost: string
    entryQuantity: string
    entryUnitCost: string
}): string {
    const currentQuantity = quantityToMillis(input.currentQuantity)
    const entryQuantity = quantityToMillis(input.entryQuantity)
    const totalQuantity = currentQuantity + entryQuantity
    if (totalQuantity === 0n) return '0.00'

    const weightedCost =
        currentQuantity * moneyToCents(input.currentAverageCost) +
        entryQuantity * moneyToCents(input.entryUnitCost)
    return centsToMoney((weightedCost + totalQuantity / 2n) / totalQuantity)
}
