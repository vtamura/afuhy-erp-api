import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createInventoryProductSchema } from '../../../application/contracts'
import type { InventoryProductResponseDto } from '../../../application/dto'
import type { CreateInventoryProductUseCase } from '../../../application/use-cases'

export class CreateInventoryProductController extends BaseController<
    typeof createInventoryProductSchema,
    InventoryProductResponseDto
> {
    protected readonly schema = createInventoryProductSchema
    constructor(private readonly useCase: CreateInventoryProductUseCase) {
        super()
    }
    protected async execute(
        input: ControllerInput<typeof createInventoryProductSchema>,
    ) {
        return {
            statusCode: 201,
            body: await this.useCase.execute({
                organizationId: input.authUser.organizationId ?? null,
                name: input.name,
                description: input.description,
                unit: input.unit,
                status: input.status,
                variants: input.variants,
            }),
        }
    }
}
