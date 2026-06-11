import { BaseController } from '../../../../../shared/presentation/http/controllers/base.controller'
import { listExamplesSchema } from '../../../application/contracts'
import type { ExampleResponseDto } from '../../../application/dto'
import type { ListExamplesUseCase } from '../../../application/use-cases'

export class ListExamplesController extends BaseController<
    typeof listExamplesSchema,
    ExampleResponseDto[]
> {
    protected readonly schema = listExamplesSchema

    constructor(private readonly listExamplesUseCase: ListExamplesUseCase) {
        super()
    }

    protected execute(): Promise<ExampleResponseDto[]> {
        return this.listExamplesUseCase.execute()
    }
}
