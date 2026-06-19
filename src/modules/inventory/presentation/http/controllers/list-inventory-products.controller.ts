import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listInventoryProductsSchema } from '../../../application/contracts'
import type { InventoryProductListResponseDto } from '../../../application/dto'
import type { ListInventoryProductsUseCase } from '../../../application/use-cases'

export class ListInventoryProductsController extends BaseController<
    typeof listInventoryProductsSchema,
    InventoryProductListResponseDto
> {
    protected readonly schema = listInventoryProductsSchema
    constructor(private readonly useCase: ListInventoryProductsUseCase) {
        super()
    }
    protected execute(
        input: ControllerInput<typeof listInventoryProductsSchema>,
    ) {
        return this.useCase.execute({
            organizationId: input.authUser.organizationId ?? null,
            status: input.status,
            search: input.search,
            lowStock: input.lowStock,
            page: input.page,
            pageSize: input.pageSize,
        })
    }
}
