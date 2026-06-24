export function normalizeLoanQuantity(value: string): string {
    return Number(value).toFixed(3)
}

export function normalizeLoanMoney(value: string): string {
    return Number(value).toFixed(2)
}
