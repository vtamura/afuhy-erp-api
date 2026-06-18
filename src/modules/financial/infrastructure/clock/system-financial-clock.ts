import type { FinancialClock } from '../../application/ports/financial-clock.port'

export class SystemFinancialClock implements FinancialClock {
    now(): Date {
        return new Date()
    }
}
