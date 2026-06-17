import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listPlansSchema } from '../../../application/contracts'
import type { PlanResponseDto } from '../../../application/dto'
import type { ListPlansUseCase } from '../../../application/use-cases'

export class ListPlansController extends BaseController<
    typeof listPlansSchema,
    PlanResponseDto[]
> {
    protected readonly schema = listPlansSchema

    constructor(private readonly listPlansUseCase: ListPlansUseCase) {
        super()
    }

    protected execute(
        _input: ControllerInput<typeof listPlansSchema>,
    ): Promise<PlanResponseDto[]> {
        return this.listPlansUseCase.execute()
    }
}
