import type { FinancialClock } from '../ports/financial-clock.port'

const timeZone = 'America/Sao_Paulo'

export function currentFinancialDate(clock: FinancialClock): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(clock.now())
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? ''

    return `${value('year')}-${value('month')}-${value('day')}`
}
