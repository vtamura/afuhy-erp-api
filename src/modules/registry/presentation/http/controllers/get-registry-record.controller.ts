import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { getRegistryRecordSchema } from '../../../application/contracts'
import type { RegistryRecordResponseDto } from '../../../application/dto'
import type { GetRegistryRecordUseCase } from '../../../application/use-cases'
import type { RegistryRecordType } from '../../../domain/entities/registry-record.entity'

export class GetRegistryRecordController extends BaseController<
    typeof getRegistryRecordSchema,
    RegistryRecordResponseDto
> {
    protected readonly schema = getRegistryRecordSchema

    constructor(
        private readonly type: RegistryRecordType,
        private readonly getRegistryRecordUseCase: GetRegistryRecordUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof getRegistryRecordSchema>,
    ): Promise<RegistryRecordResponseDto> {
        return this.getRegistryRecordUseCase.execute({
            type: this.type,
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
