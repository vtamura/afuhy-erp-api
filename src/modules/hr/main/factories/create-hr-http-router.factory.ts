import { HrService } from '../../application/use-cases'
import type { HrRepository } from '../../domain/repositories/hr.repository'
import {
    CreateEmployeeAssignmentController,
    CreateEmployeeController,
    CreateHrCatalogController,
    CreatePayrollProvisionController,
    CreateSalaryChangeController,
    DeleteEmployeeController,
    DeleteHrCatalogController,
    GetEmployeeController,
    GetHrCatalogController,
    GetHrSummaryController,
    ListEmployeeAssignmentsController,
    ListEmployeesController,
    ListHrCatalogController,
    ListSalaryChangesController,
    UpdateEmployeeController,
    UpdateHrCatalogController,
} from '../../presentation/http/controllers'
import { createHrRouter } from '../../presentation/http/routes'
import type { HrHttpRouterFactoryDependencies } from './hr-http-router-factory.types'

const catalogControllers = (
    service: HrService,
    type: 'department' | 'position',
) => ({
    create: new CreateHrCatalogController(service, type),
    list: new ListHrCatalogController(service, type),
    get: new GetHrCatalogController(service, type),
    update: new UpdateHrCatalogController(service, type),
    delete: new DeleteHrCatalogController(service, type),
})

export function createHrHttpRouterFactory(
    deps: HrHttpRouterFactoryDependencies,
) {
    const service = new HrService(
        deps.hrRepository,
        deps.payrollProvisionFinancialPort,
    )
    return createHrRouter({
        controllers: {
            departments: catalogControllers(service, 'department'),
            positions: catalogControllers(service, 'position'),
            createEmployee: new CreateEmployeeController(service),
            listEmployees: new ListEmployeesController(service),
            getEmployee: new GetEmployeeController(service),
            updateEmployee: new UpdateEmployeeController(service),
            deleteEmployee: new DeleteEmployeeController(service),
            createAssignment: new CreateEmployeeAssignmentController(service),
            listAssignments: new ListEmployeeAssignmentsController(service),
            createSalaryChange: new CreateSalaryChangeController(service),
            listSalaryChanges: new ListSalaryChangesController(service),
            getSummary: new GetHrSummaryController(service),
            createPayrollProvision: new CreatePayrollProvisionController(
                service,
            ),
        },
        ...deps.middlewares,
    })
}

export type { HrRepository }
