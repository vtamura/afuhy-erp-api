import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { listRegistryRecordsSchema } from '../../../application/contracts'
import type { RegistryRecordResponseDto } from '../../../application/dto'
import type { ListRegistryRecordsUseCase } from '../../../application/use-cases'
import type { RegistryRecordType } from '../../../domain/entities/registry-record.entity'

export class ListRegistryRecordsController extends BaseController<
    typeof listRegistryRecordsSchema,
    RegistryRecordResponseDto[]
> {
    protected readonly schema = listRegistryRecordsSchema

    constructor(
        private readonly type: RegistryRecordType,
        private readonly listRegistryRecordsUseCase: ListRegistryRecordsUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof listRegistryRecordsSchema>,
    ): Promise<RegistryRecordResponseDto[]> {
        return this.listRegistryRecordsUseCase.execute({
            type: this.type,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
