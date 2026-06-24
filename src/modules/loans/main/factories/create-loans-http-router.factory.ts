import { LoanService } from '../../application/use-cases'
import {
    CancelLoanChargeController,
    CancelLoanController,
    CreateLoanChargeController,
    CreateLoanController,
    CreateLoanOccurrenceController,
    CreateLoanReturnController,
    GetLoanController,
    ListLoansController,
    ReleaseLoanController,
    UpdateLoanController,
} from '../../presentation/http/controllers'
import { createLoansRouter } from '../../presentation/http/routes'
import type { LoansHttpRouterFactoryDependencies } from './loans-http-router-factory.types'

export function createLoansHttpRouterFactory(
    deps: LoansHttpRouterFactoryDependencies,
) {
    const service = new LoanService(deps.loanRepository)
    return createLoansRouter({
        controllers: {
            create: new CreateLoanController(service),
            list: new ListLoansController(service),
            get: new GetLoanController(service),
            update: new UpdateLoanController(service),
            release: new ReleaseLoanController(service),
            cancel: new CancelLoanController(service),
            createReturn: new CreateLoanReturnController(service),
            createOccurrence: new CreateLoanOccurrenceController(service),
            createCharge: new CreateLoanChargeController(service),
            cancelCharge: new CancelLoanChargeController(service),
        },
        ...deps.middlewares,
    })
}
