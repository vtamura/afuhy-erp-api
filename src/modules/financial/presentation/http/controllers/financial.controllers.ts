import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import {
    cancelFinancialTransactionSchema,
    createFinancialAccountSchema,
    createFinancialCategorySchema,
    createFinancialTransactionSchema,
    deleteFinancialAccountSchema,
    deleteFinancialCategorySchema,
    deleteFinancialTransactionSchema,
    getFinancialAccountSchema,
    getFinancialCategorySchema,
    getFinancialTransactionSchema,
    listFinancialAccountsSchema,
    listFinancialCategoriesSchema,
    listFinancialTransactionsSchema,
    payFinancialTransactionSchema,
    updateFinancialAccountSchema,
    updateFinancialCategorySchema,
    updateFinancialTransactionSchema,
} from '../../../application/contracts'
import type {
    FinancialAccountResponseDto,
    FinancialCategoryResponseDto,
    FinancialTransactionListResponseDto,
    FinancialTransactionResponseDto,
} from '../../../application/dto'
import type {
    CancelFinancialTransactionUseCase,
    CreateFinancialAccountUseCase,
    CreateFinancialCategoryUseCase,
    CreateFinancialTransactionUseCase,
    DeleteFinancialAccountUseCase,
    DeleteFinancialCategoryUseCase,
    DeleteFinancialTransactionUseCase,
    GetFinancialAccountUseCase,
    GetFinancialCategoryUseCase,
    GetFinancialTransactionUseCase,
    ListFinancialAccountsUseCase,
    ListFinancialCategoriesUseCase,
    ListFinancialTransactionsUseCase,
    PayFinancialTransactionUseCase,
    UpdateFinancialAccountUseCase,
    UpdateFinancialCategoryUseCase,
    UpdateFinancialTransactionUseCase,
} from '../../../application/use-cases'

type CreatedResponse<T> = { statusCode: 201; body: T }

export class CreateFinancialAccountController extends BaseController<
    typeof createFinancialAccountSchema,
    FinancialAccountResponseDto
> {
    protected readonly schema = createFinancialAccountSchema
    constructor(private readonly useCase: CreateFinancialAccountUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createFinancialAccountSchema>,
    ): Promise<CreatedResponse<FinancialAccountResponseDto>> {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                name: input.name,
                type: input.type,
                initialBalance: input.initialBalance,
                status: input.status,
            }),
        }
    }
}

export class ListFinancialAccountsController extends BaseController<
    typeof listFinancialAccountsSchema,
    FinancialAccountResponseDto[]
> {
    protected readonly schema = listFinancialAccountsSchema
    constructor(private readonly useCase: ListFinancialAccountsUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listFinancialAccountsSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class GetFinancialAccountController extends BaseController<
    typeof getFinancialAccountSchema,
    FinancialAccountResponseDto
> {
    protected readonly schema = getFinancialAccountSchema
    constructor(private readonly useCase: GetFinancialAccountUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getFinancialAccountSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class UpdateFinancialAccountController extends BaseController<
    typeof updateFinancialAccountSchema,
    FinancialAccountResponseDto
> {
    protected readonly schema = updateFinancialAccountSchema
    constructor(private readonly useCase: UpdateFinancialAccountUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof updateFinancialAccountSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            type: input.type,
            initialBalance: input.initialBalance,
            status: input.status,
        })
    }
}

export class DeleteFinancialAccountController extends BaseController<
    typeof deleteFinancialAccountSchema
> {
    protected readonly schema = deleteFinancialAccountSchema
    constructor(private readonly useCase: DeleteFinancialAccountUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof deleteFinancialAccountSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class CreateFinancialCategoryController extends BaseController<
    typeof createFinancialCategorySchema,
    FinancialCategoryResponseDto
> {
    protected readonly schema = createFinancialCategorySchema
    constructor(private readonly useCase: CreateFinancialCategoryUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createFinancialCategorySchema>,
    ): Promise<CreatedResponse<FinancialCategoryResponseDto>> {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                name: input.name,
                type: input.type,
                status: input.status,
            }),
        }
    }
}

export class ListFinancialCategoriesController extends BaseController<
    typeof listFinancialCategoriesSchema,
    FinancialCategoryResponseDto[]
> {
    protected readonly schema = listFinancialCategoriesSchema
    constructor(private readonly useCase: ListFinancialCategoriesUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listFinancialCategoriesSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class GetFinancialCategoryController extends BaseController<
    typeof getFinancialCategorySchema,
    FinancialCategoryResponseDto
> {
    protected readonly schema = getFinancialCategorySchema
    constructor(private readonly useCase: GetFinancialCategoryUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getFinancialCategorySchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class UpdateFinancialCategoryController extends BaseController<
    typeof updateFinancialCategorySchema,
    FinancialCategoryResponseDto
> {
    protected readonly schema = updateFinancialCategorySchema
    constructor(private readonly useCase: UpdateFinancialCategoryUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof updateFinancialCategorySchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            type: input.type,
            status: input.status,
        })
    }
}

export class DeleteFinancialCategoryController extends BaseController<
    typeof deleteFinancialCategorySchema
> {
    protected readonly schema = deleteFinancialCategorySchema
    constructor(private readonly useCase: DeleteFinancialCategoryUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof deleteFinancialCategorySchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class CreateFinancialTransactionController extends BaseController<
    typeof createFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = createFinancialTransactionSchema
    constructor(private readonly useCase: CreateFinancialTransactionUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createFinancialTransactionSchema>,
    ): Promise<CreatedResponse<FinancialTransactionResponseDto>> {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                createdBy: input.authUser.userId,
                accountId: input.accountId,
                categoryId: input.categoryId,
                customerId: input.customerId,
                supplierId: input.supplierId,
                description: input.description,
                notes: input.notes,
                type: input.type,
                amount: input.amount,
                transactionDate: input.transactionDate,
                dueDate: input.dueDate,
            }),
        }
    }
}

export class ListFinancialTransactionsController extends BaseController<
    typeof listFinancialTransactionsSchema,
    FinancialTransactionListResponseDto
> {
    protected readonly schema = listFinancialTransactionsSchema
    constructor(private readonly useCase: ListFinancialTransactionsUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listFinancialTransactionsSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
            accountId: input.accountId,
            categoryId: input.categoryId,
            customerId: input.customerId,
            supplierId: input.supplierId,
            type: input.type,
            status: input.status,
            startDate: input.startDate,
            endDate: input.endDate,
            page: input.page,
            pageSize: input.pageSize,
        })
    }
}

export class GetFinancialTransactionController extends BaseController<
    typeof getFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = getFinancialTransactionSchema
    constructor(private readonly useCase: GetFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof getFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class UpdateFinancialTransactionController extends BaseController<
    typeof updateFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = updateFinancialTransactionSchema
    constructor(private readonly useCase: UpdateFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof updateFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            accountId: input.accountId,
            categoryId: input.categoryId,
            customerId: input.customerId,
            supplierId: input.supplierId,
            description: input.description,
            notes: input.notes,
            type: input.type,
            amount: input.amount,
            transactionDate: input.transactionDate,
            dueDate: input.dueDate,
        })
    }
}

export class PayFinancialTransactionController extends BaseController<
    typeof payFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = payFinancialTransactionSchema
    constructor(private readonly useCase: PayFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof payFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class CancelFinancialTransactionController extends BaseController<
    typeof cancelFinancialTransactionSchema,
    FinancialTransactionResponseDto
> {
    protected readonly schema = cancelFinancialTransactionSchema
    constructor(private readonly useCase: CancelFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof cancelFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}

export class DeleteFinancialTransactionController extends BaseController<
    typeof deleteFinancialTransactionSchema
> {
    protected readonly schema = deleteFinancialTransactionSchema
    constructor(private readonly useCase: DeleteFinancialTransactionUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof deleteFinancialTransactionSchema>,
    ) {
        return this.useCase.execute({
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
