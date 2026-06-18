import { ForbiddenError } from '../../../../shared/domain/errors'
import { centsToMoney, moneyToCents } from '../../domain/money/money'
import type { FinancialDashboardRepository } from '../../domain/repositories/financial-dashboard.repository'
import type { FinancialClock } from '../ports/financial-clock.port'
import type { FinancialDashboardResponseDto } from '../dto'
import {
    toFinancialAccountResponseDto,
    toFinancialTransactionResponseDto,
} from '../mappers/financial-response.mapper'

const timeZone = 'America/Sao_Paulo'

export class GetFinancialDashboardUseCase {
    constructor(
        private readonly repository: FinancialDashboardRepository,
        private readonly clock: FinancialClock,
    ) {}

    async execute(input: {
        organizationId: string | null
        year?: number
        month?: number
    }): Promise<FinancialDashboardResponseDto> {
        if (!input.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const today = zonedDate(this.clock.now())
        const year = input.year ?? today.year
        const month = input.month ?? today.month
        const periodStart = monthStart(year, month)
        const periodEnd = monthEnd(year, month)
        const series = buildMonthSeries(year, month, 12)
        const data = await this.repository.getDashboard({
            organizationId: input.organizationId,
            periodStart,
            periodEnd,
            seriesStart: monthStart(series[0].year, series[0].month),
            today: today.date,
            upcomingEnd: addDays(today.date, 7),
        })
        const current = data.accounts.reduce(
            (total, account) => total + moneyToCents(account.currentBalance),
            0n,
        )
        const projected = data.accounts.reduce(
            (total, account) => total + moneyToCents(account.projectedBalance),
            0n,
        )
        const monthlyByKey = new Map(
            data.monthlyFlow.map((item) => [
                `${item.year}-${item.month}`,
                item,
            ]),
        )

        return {
            period: {
                year,
                month,
                startDate: periodStart,
                endDate: periodEnd,
            },
            balances: {
                current: centsToMoney(current),
                projected: centsToMoney(projected),
            },
            cashFlow: {
                ...data.cashFlow,
                result: centsToMoney(
                    moneyToCents(data.cashFlow.paidIncome) -
                        moneyToCents(data.cashFlow.paidExpense),
                ),
            },
            accounts: data.accounts.map(toFinancialAccountResponseDto),
            monthlyFlow: series.map(({ year: itemYear, month: itemMonth }) => {
                const item = monthlyByKey.get(`${itemYear}-${itemMonth}`)

                return (
                    item ?? {
                        year: itemYear,
                        month: itemMonth,
                        income: '0.00',
                        expense: '0.00',
                        result: '0.00',
                    }
                )
            }),
            categories: {
                income: data.incomeCategories.map(stripCategoryType),
                expense: data.expenseCategories.map(stripCategoryType),
            },
            overdue: {
                ...data.overdue,
                items: data.overdue.items.map(
                    toFinancialTransactionResponseDto,
                ),
            },
            upcoming: {
                ...data.upcoming,
                items: data.upcoming.items.map(
                    toFinancialTransactionResponseDto,
                ),
            },
        }
    }
}

function stripCategoryType(category: {
    categoryId: string
    name: string
    type: 'INCOME' | 'EXPENSE'
    amount: string
    percentage: string
}) {
    const { type: _type, ...response } = category
    return response
}

function zonedDate(date: Date): {
    year: number
    month: number
    date: string
} {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date)
    const value = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? ''
    const year = Number(value('year'))
    const month = Number(value('month'))
    const day = Number(value('day'))

    return {
        year,
        month,
        date: formatDate(year, month, day),
    }
}

function buildMonthSeries(year: number, month: number, count: number) {
    const series: Array<{ year: number; month: number }> = []

    for (let offset = count - 1; offset >= 0; offset -= 1) {
        const date = new Date(Date.UTC(year, month - 1 - offset, 1))
        series.push({
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
        })
    }

    return series
}

function monthStart(year: number, month: number): string {
    return formatDate(year, month, 1)
}

function monthEnd(year: number, month: number): string {
    const date = new Date(Date.UTC(year, month, 0))
    return formatDate(year, month, date.getUTCDate())
}

function addDays(date: string, days: number): string {
    const value = new Date(`${date}T00:00:00.000Z`)
    value.setUTCDate(value.getUTCDate() + days)
    return formatDate(
        value.getUTCFullYear(),
        value.getUTCMonth() + 1,
        value.getUTCDate(),
    )
}

function formatDate(year: number, month: number, day: number): string {
    return `${year.toString().padStart(4, '0')}-${month
        .toString()
        .padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}
