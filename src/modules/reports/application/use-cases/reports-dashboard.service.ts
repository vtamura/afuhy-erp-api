import { ForbiddenError } from '../../../../shared/domain/errors'
import type { ReportSeverity } from '../../domain/entities/report.entity'
import type {
    ReportsDashboardQuery,
    ReportsRepository,
} from '../../domain/repositories/report.repository'
import type {
    ReportsFinancialResponseDto,
    ReportsHrResponseDto,
    ReportsInventoryResponseDto,
    ReportsLoansResponseDto,
    ReportsOverviewResponseDto,
    ReportsTasksResponseDto,
} from '../dto'

const timeZone = 'America/Sao_Paulo'

export type ReportsClock = {
    now(): Date
}

export class SystemReportsClock implements ReportsClock {
    now(): Date {
        return new Date()
    }
}

export class ReportsDashboardService {
    constructor(
        private readonly repository: ReportsRepository,
        private readonly clock: ReportsClock = new SystemReportsClock(),
    ) {}

    async overview(input: {
        organizationId: string | null
        year?: number
        month?: number
    }): Promise<ReportsOverviewResponseDto> {
        const query = this.buildQuery(input)
        const [financial, inventory, hr, loans, tasks] = await Promise.all([
            this.repository.getFinancial(query),
            this.repository.getInventory(query),
            this.repository.getHr(query),
            this.repository.getLoans(query),
            this.repository.getTasks(query),
        ])

        return {
            period: {
                year: query.year,
                month: query.month,
                startDate: query.periodStart,
                endDate: query.periodEnd,
            },
            financial,
            inventory,
            hr,
            loans,
            tasks,
            attention: {
                financialOverdue: {
                    count: financial.overdue.count,
                    severity: severity(financial.overdue.count),
                    items: financial.overdue.items,
                },
                inventoryLowStock: {
                    count: inventory.lowStockCount,
                    severity: severity(inventory.lowStockCount),
                    items: inventory.lowStockItems,
                },
                loansOverdue: {
                    count: loans.overdueLoans,
                    severity: severity(loans.overdueLoans),
                    items: loans.overdueItems,
                },
                tasksUrgentOrOverdue: {
                    count: Math.max(tasks.overdueTasks, tasks.urgentTasks),
                    severity: severity(
                        Math.max(tasks.overdueTasks, tasks.urgentTasks),
                    ),
                    items: tasks.attentionItems,
                },
            },
        }
    }

    async financial(input: {
        organizationId: string | null
        year?: number
        month?: number
    }): Promise<ReportsFinancialResponseDto> {
        const query = this.buildQuery(input)
        return {
            period: this.toPeriod(query),
            financial: await this.repository.getFinancial(query),
        }
    }

    async inventory(input: {
        organizationId: string | null
        year?: number
        month?: number
    }): Promise<ReportsInventoryResponseDto> {
        const query = this.buildQuery(input)
        return {
            period: this.toPeriod(query),
            inventory: await this.repository.getInventory(query),
        }
    }

    async hr(input: {
        organizationId: string | null
        year?: number
        month?: number
    }): Promise<ReportsHrResponseDto> {
        const query = this.buildQuery(input)
        return {
            period: this.toPeriod(query),
            hr: await this.repository.getHr(query),
        }
    }

    async loans(input: {
        organizationId: string | null
        year?: number
        month?: number
    }): Promise<ReportsLoansResponseDto> {
        const query = this.buildQuery(input)
        return {
            period: this.toPeriod(query),
            loans: await this.repository.getLoans(query),
        }
    }

    async tasks(input: {
        organizationId: string | null
        year?: number
        month?: number
    }): Promise<ReportsTasksResponseDto> {
        const query = this.buildQuery(input)
        return {
            period: this.toPeriod(query),
            tasks: await this.repository.getTasks(query),
        }
    }

    private buildQuery(input: {
        organizationId: string | null
        year?: number
        month?: number
    }): ReportsDashboardQuery & { year: number; month: number } {
        if (!input.organizationId) {
            throw new ForbiddenError('Organizacao nao selecionada')
        }

        const today = zonedDate(this.clock.now())
        const year = input.year ?? today.year
        const month = input.month ?? today.month
        const periodStart = monthStart(year, month)
        const periodEnd = monthEnd(year, month)
        const series = buildMonthSeries(year, month, 12)

        return {
            organizationId: input.organizationId,
            year,
            month,
            periodStart,
            periodEnd,
            seriesStart: monthStart(series[0].year, series[0].month),
            today: today.date,
        }
    }

    private toPeriod(
        query: ReportsDashboardQuery & { year: number; month: number },
    ) {
        return {
            year: query.year,
            month: query.month,
            startDate: query.periodStart,
            endDate: query.periodEnd,
        }
    }
}

function severity(count: number): ReportSeverity {
    if (count >= 10) return 'HIGH'
    if (count > 0) return 'MEDIUM'
    return 'LOW'
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

    return {
        year: Number(value('year')),
        month: Number(value('month')),
        date: `${value('year')}-${value('month')}-${value('day')}`,
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
    return `${year.toString().padStart(4, '0')}-${month
        .toString()
        .padStart(2, '0')}-01`
}

function monthEnd(year: number, month: number): string {
    const date = new Date(Date.UTC(year, month, 0))
    return `${year.toString().padStart(4, '0')}-${month
        .toString()
        .padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`
}
