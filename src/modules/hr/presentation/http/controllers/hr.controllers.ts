import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import {
    createEmployeeAssignmentSchema,
    createEmployeeSchema,
    createHrCatalogSchema,
    createPayrollProvisionSchema,
    createSalaryChangeSchema,
    deleteEmployeeSchema,
    deleteHrCatalogSchema,
    getEmployeeSchema,
    getHrCatalogSchema,
    getHrSummarySchema,
    listEmployeeAssignmentsSchema,
    listEmployeesSchema,
    listHrCatalogSchema,
    listSalaryChangesSchema,
    updateEmployeeSchema,
    updateHrCatalogSchema,
} from '../../../application/contracts'
import type { HrService } from '../../../application/use-cases'
import type { HrCatalogType } from '../../../domain/repositories/hr.repository'

export class CreateHrCatalogController extends BaseController<
    typeof createHrCatalogSchema
> {
    protected readonly schema = createHrCatalogSchema
    constructor(
        private readonly service: HrService,
        private readonly type: HrCatalogType,
    ) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createHrCatalogSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.service.createCatalog({
                type: this.type,
                organizationId: input.authUser.organizationId ?? null,
                name: input.name,
                description: input.description,
                status: input.status,
            }),
        }
    }
}

export class ListHrCatalogController extends BaseController<
    typeof listHrCatalogSchema
> {
    protected readonly schema = listHrCatalogSchema
    constructor(
        private readonly service: HrService,
        private readonly type: HrCatalogType,
    ) {
        super()
    }
    protected execute(input: ControllerInput<typeof listHrCatalogSchema>) {
        return this.service.listCatalog({
            type: this.type,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class GetHrCatalogController extends BaseController<
    typeof getHrCatalogSchema
> {
    protected readonly schema = getHrCatalogSchema
    constructor(
        private readonly service: HrService,
        private readonly type: HrCatalogType,
    ) {
        super()
    }
    protected execute(input: ControllerInput<typeof getHrCatalogSchema>) {
        return this.service.getCatalog({
            type: this.type,
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class UpdateHrCatalogController extends BaseController<
    typeof updateHrCatalogSchema
> {
    protected readonly schema = updateHrCatalogSchema
    constructor(
        private readonly service: HrService,
        private readonly type: HrCatalogType,
    ) {
        super()
    }
    protected execute(input: ControllerInput<typeof updateHrCatalogSchema>) {
        return this.service.updateCatalog({
            type: this.type,
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            description: input.description,
            status: input.status,
        })
    }
}

export class DeleteHrCatalogController extends BaseController<
    typeof deleteHrCatalogSchema
> {
    protected readonly schema = deleteHrCatalogSchema
    constructor(
        private readonly service: HrService,
        private readonly type: HrCatalogType,
    ) {
        super()
    }
    protected execute(input: ControllerInput<typeof deleteHrCatalogSchema>) {
        return this.service.deleteCatalog({
            type: this.type,
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class CreateEmployeeController extends BaseController<
    typeof createEmployeeSchema
> {
    protected readonly schema = createEmployeeSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createEmployeeSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.service.createEmployee({
                ...input,
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
            }),
        }
    }
}

export class ListEmployeesController extends BaseController<
    typeof listEmployeesSchema
> {
    protected readonly schema = listEmployeesSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected execute(input: ControllerInput<typeof listEmployeesSchema>) {
        return this.service.listEmployees({
            organizationId: input.authUser.organizationId ?? null,
            status: input.status,
            departmentId: input.departmentId,
            positionId: input.positionId,
            organizationUserId: input.organizationUserId,
            search: input.search,
            page: input.page,
            pageSize: input.pageSize,
        })
    }
}

export class GetEmployeeController extends BaseController<
    typeof getEmployeeSchema
> {
    protected readonly schema = getEmployeeSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected execute(input: ControllerInput<typeof getEmployeeSchema>) {
        return this.service.getEmployee({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class UpdateEmployeeController extends BaseController<
    typeof updateEmployeeSchema
> {
    protected readonly schema = updateEmployeeSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected execute(input: ControllerInput<typeof updateEmployeeSchema>) {
        return this.service.updateEmployee({
            ...input,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class DeleteEmployeeController extends BaseController<
    typeof deleteEmployeeSchema
> {
    protected readonly schema = deleteEmployeeSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected execute(input: ControllerInput<typeof deleteEmployeeSchema>) {
        return this.service.deleteEmployee({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class CreateEmployeeAssignmentController extends BaseController<
    typeof createEmployeeAssignmentSchema
> {
    protected readonly schema = createEmployeeAssignmentSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createEmployeeAssignmentSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.service.createAssignment({
                ...input,
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
            }),
        }
    }
}

export class ListEmployeeAssignmentsController extends BaseController<
    typeof listEmployeeAssignmentsSchema
> {
    protected readonly schema = listEmployeeAssignmentsSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listEmployeeAssignmentsSchema>,
    ) {
        return this.service.listAssignments({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class CreateSalaryChangeController extends BaseController<
    typeof createSalaryChangeSchema
> {
    protected readonly schema = createSalaryChangeSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createSalaryChangeSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.service.createSalaryChange({
                ...input,
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
            }),
        }
    }
}

export class ListSalaryChangesController extends BaseController<
    typeof listSalaryChangesSchema
> {
    protected readonly schema = listSalaryChangesSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected execute(input: ControllerInput<typeof listSalaryChangesSchema>) {
        return this.service.listSalaryChanges({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class GetHrSummaryController extends BaseController<
    typeof getHrSummarySchema
> {
    protected readonly schema = getHrSummarySchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected execute(input: ControllerInput<typeof getHrSummarySchema>) {
        return this.service.getSummary({
            organizationId: input.authUser.organizationId ?? null,
            year: input.year,
            month: input.month,
        })
    }
}

export class CreatePayrollProvisionController extends BaseController<
    typeof createPayrollProvisionSchema
> {
    protected readonly schema = createPayrollProvisionSchema
    constructor(private readonly service: HrService) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createPayrollProvisionSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.service.createPayrollProvision({
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
                year: input.year,
                month: input.month,
                dueDate: input.dueDate,
                accountId: input.accountId,
                categoryId: input.categoryId,
            }),
        }
    }
}
