import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getReportDashboardSchema } from '../../../application/contracts'
import type {
    ReportsFinancialResponseDto,
    ReportsHrResponseDto,
    ReportsInventoryResponseDto,
    ReportsLoansResponseDto,
    ReportsOverviewResponseDto,
    ReportsTasksResponseDto,
} from '../../../application/dto'
import type { ReportsDashboardService } from '../../../application/use-cases'

abstract class ReportDashboardController<TOutput> extends BaseController<
    typeof getReportDashboardSchema,
    TOutput
> {
    protected readonly schema = getReportDashboardSchema

    constructor(protected readonly service: ReportsDashboardService) {
        super()
    }

    protected input(input: ControllerInput<typeof getReportDashboardSchema>) {
        return {
            organizationId: input.authUser.organizationId ?? null,
            year: input.year,
            month: input.month,
        }
    }
}

export class GetReportsOverviewController extends ReportDashboardController<ReportsOverviewResponseDto> {
    protected execute(input: ControllerInput<typeof getReportDashboardSchema>) {
        return this.service.overview(this.input(input))
    }
}

export class GetReportsFinancialController extends ReportDashboardController<ReportsFinancialResponseDto> {
    protected execute(input: ControllerInput<typeof getReportDashboardSchema>) {
        return this.service.financial(this.input(input))
    }
}

export class GetReportsInventoryController extends ReportDashboardController<ReportsInventoryResponseDto> {
    protected execute(input: ControllerInput<typeof getReportDashboardSchema>) {
        return this.service.inventory(this.input(input))
    }
}

export class GetReportsHrController extends ReportDashboardController<ReportsHrResponseDto> {
    protected execute(input: ControllerInput<typeof getReportDashboardSchema>) {
        return this.service.hr(this.input(input))
    }
}

export class GetReportsLoansController extends ReportDashboardController<ReportsLoansResponseDto> {
    protected execute(input: ControllerInput<typeof getReportDashboardSchema>) {
        return this.service.loans(this.input(input))
    }
}

export class GetReportsTasksController extends ReportDashboardController<ReportsTasksResponseDto> {
    protected execute(input: ControllerInput<typeof getReportDashboardSchema>) {
        return this.service.tasks(this.input(input))
    }
}
