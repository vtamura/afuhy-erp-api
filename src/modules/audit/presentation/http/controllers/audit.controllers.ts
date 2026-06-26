import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import {
    getAuditLogSchema,
    listAuditLogsSchema,
} from '../../../application/contracts'
import type {
    AuditLogListResponseDto,
    AuditLogResponseDto,
} from '../../../application/dto'
import type {
    GetAuditLogUseCase,
    ListAuditLogsUseCase,
} from '../../../application/use-cases'

export class ListAuditLogsController extends BaseController<
    typeof listAuditLogsSchema,
    AuditLogListResponseDto
> {
    protected readonly schema = listAuditLogsSchema

    constructor(private readonly useCase: ListAuditLogsUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listAuditLogsSchema>,
    ): Promise<AuditLogListResponseDto> {
        return this.useCase.execute(input)
    }
}

export class GetAuditLogController extends BaseController<
    typeof getAuditLogSchema,
    AuditLogResponseDto
> {
    protected readonly schema = getAuditLogSchema

    constructor(private readonly useCase: GetAuditLogUseCase) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof getAuditLogSchema>,
    ): Promise<AuditLogResponseDto> {
        return this.useCase.execute(input)
    }
}
