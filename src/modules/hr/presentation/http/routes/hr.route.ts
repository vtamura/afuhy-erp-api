import { Router, type RequestHandler } from 'express'
import { AUTH_PERMISSIONS } from '../../../../auth/domain/rbac/default-rbac'
import type {
    CreateEmployeeAssignmentController,
    CreateEmployeeController,
    CreateHrCatalogController,
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
} from '../controllers'

type CatalogControllers = {
    create: CreateHrCatalogController
    list: ListHrCatalogController
    get: GetHrCatalogController
    update: UpdateHrCatalogController
    delete: DeleteHrCatalogController
}

export function createHrRouter(params: {
    controllers: {
        departments: CatalogControllers
        positions: CatalogControllers
        createEmployee: CreateEmployeeController
        listEmployees: ListEmployeesController
        getEmployee: GetEmployeeController
        updateEmployee: UpdateEmployeeController
        deleteEmployee: DeleteEmployeeController
        createAssignment: CreateEmployeeAssignmentController
        listAssignments: ListEmployeeAssignmentsController
        createSalaryChange: CreateSalaryChangeController
        listSalaryChanges: ListSalaryChangesController
        getSummary: GetHrSummaryController
    }
    authenticateAccessTokenMiddleware: RequestHandler
    authorizePermissionMiddleware: (permissionCode: string) => RequestHandler
    authorizeFeatureMiddleware: (featureCode: string) => RequestHandler
}): Router {
    const router = Router()
    const auth = params.authenticateAccessTokenMiddleware
    const feature = params.authorizeFeatureMiddleware('hr.basic')
    const permission = params.authorizePermissionMiddleware
    const read = permission(AUTH_PERMISSIONS.HR_EMPLOYEES_READ)
    const manage = permission(AUTH_PERMISSIONS.HR_EMPLOYEES_MANAGE)
    const compensationRead = permission(AUTH_PERMISSIONS.HR_COMPENSATION_READ)
    const compensationManage = permission(
        AUTH_PERMISSIONS.HR_COMPENSATION_MANAGE,
    )

    const catalogRoutes = (path: string, controllers: CatalogControllers) => {
        router.post(path, auth, manage, feature, controllers.create.handle)
        router.get(path, auth, read, feature, controllers.list.handle)
        router.get(`${path}/:id`, auth, read, feature, controllers.get.handle)
        router.patch(
            `${path}/:id`,
            auth,
            manage,
            feature,
            controllers.update.handle,
        )
        router.delete(
            `${path}/:id`,
            auth,
            manage,
            feature,
            controllers.delete.handle,
        )
    }

    catalogRoutes('/hr/departments', params.controllers.departments)
    catalogRoutes('/hr/positions', params.controllers.positions)
    router.get(
        '/hr/summary',
        auth,
        read,
        feature,
        params.controllers.getSummary.handle,
    )
    router.post(
        '/hr/employees',
        auth,
        manage,
        feature,
        params.controllers.createEmployee.handle,
    )
    router.get(
        '/hr/employees',
        auth,
        read,
        feature,
        params.controllers.listEmployees.handle,
    )
    router.get(
        '/hr/employees/:id',
        auth,
        read,
        feature,
        params.controllers.getEmployee.handle,
    )
    router.patch(
        '/hr/employees/:id',
        auth,
        manage,
        feature,
        params.controllers.updateEmployee.handle,
    )
    router.delete(
        '/hr/employees/:id',
        auth,
        manage,
        feature,
        params.controllers.deleteEmployee.handle,
    )
    router.post(
        '/hr/employees/:id/assignments',
        auth,
        manage,
        feature,
        params.controllers.createAssignment.handle,
    )
    router.get(
        '/hr/employees/:id/assignments',
        auth,
        read,
        feature,
        params.controllers.listAssignments.handle,
    )
    router.post(
        '/hr/employees/:id/salary-changes',
        auth,
        compensationManage,
        feature,
        params.controllers.createSalaryChange.handle,
    )
    router.get(
        '/hr/employees/:id/salary-changes',
        auth,
        compensationRead,
        feature,
        params.controllers.listSalaryChanges.handle,
    )
    return router
}
