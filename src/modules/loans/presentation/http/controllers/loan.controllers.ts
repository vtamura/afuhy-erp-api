import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import {
    cancelLoanChargeSchema,
    cancelLoanSchema,
    createLoanChargeSchema,
    createLoanOccurrenceSchema,
    createLoanReturnSchema,
    createLoanSchema,
    getLoanSchema,
    listLoansSchema,
    releaseLoanSchema,
    updateLoanSchema,
} from '../../../application/contracts'
import type { LoanService } from '../../../application/use-cases'

export class CreateLoanController extends BaseController<
    typeof createLoanSchema
> {
    protected readonly schema = createLoanSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected async execute(input: ControllerInput<typeof createLoanSchema>) {
        return {
            statusCode: 201,
            body: await this.service.create({
                ...input,
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
            }),
        }
    }
}

export class ListLoansController extends BaseController<
    typeof listLoansSchema
> {
    protected readonly schema = listLoansSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected execute(input: ControllerInput<typeof listLoansSchema>) {
        return this.service.list({
            organizationId: input.authUser.organizationId ?? null,
            status: input.status,
            borrowerType: input.borrowerType,
            borrowerId: input.borrowerId,
            overdue: input.overdue,
            search: input.search,
            startDate: input.startDate,
            endDate: input.endDate,
            page: input.page,
            pageSize: input.pageSize,
        })
    }
}

export class GetLoanController extends BaseController<typeof getLoanSchema> {
    protected readonly schema = getLoanSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected execute(input: ControllerInput<typeof getLoanSchema>) {
        return this.service.get({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class UpdateLoanController extends BaseController<
    typeof updateLoanSchema
> {
    protected readonly schema = updateLoanSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected execute(input: ControllerInput<typeof updateLoanSchema>) {
        return this.service.update({
            ...input,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class ReleaseLoanController extends BaseController<
    typeof releaseLoanSchema
> {
    protected readonly schema = releaseLoanSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected execute(input: ControllerInput<typeof releaseLoanSchema>) {
        return this.service.release({
            ...input,
            organizationId: input.authUser.organizationId ?? null,
            createdBy: input.authUser.userId,
        })
    }
}

export class CancelLoanController extends BaseController<
    typeof cancelLoanSchema
> {
    protected readonly schema = cancelLoanSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected execute(input: ControllerInput<typeof cancelLoanSchema>) {
        return this.service.cancel({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class CreateLoanReturnController extends BaseController<
    typeof createLoanReturnSchema
> {
    protected readonly schema = createLoanReturnSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createLoanReturnSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.service.createReturn({
                ...input,
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
            }),
        }
    }
}

export class CreateLoanOccurrenceController extends BaseController<
    typeof createLoanOccurrenceSchema
> {
    protected readonly schema = createLoanOccurrenceSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createLoanOccurrenceSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.service.createOccurrence({
                ...input,
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
            }),
        }
    }
}

export class CreateLoanChargeController extends BaseController<
    typeof createLoanChargeSchema
> {
    protected readonly schema = createLoanChargeSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createLoanChargeSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.service.createCharge({
                ...input,
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
            }),
        }
    }
}

export class CancelLoanChargeController extends BaseController<
    typeof cancelLoanChargeSchema
> {
    protected readonly schema = cancelLoanChargeSchema
    constructor(private readonly service: LoanService) {
        super()
    }
    protected execute(input: ControllerInput<typeof cancelLoanChargeSchema>) {
        return this.service.cancelCharge({
            id: input.id,
            chargeId: input.chargeId,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
