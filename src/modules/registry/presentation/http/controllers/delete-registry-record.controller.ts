import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { deleteRegistryRecordSchema } from '../../../application/contracts'
import type { DeleteRegistryRecordUseCase } from '../../../application/use-cases'
import type { RegistryRecordType } from '../../../domain/entities/registry-record.entity'

export class DeleteRegistryRecordController extends BaseController<
    typeof deleteRegistryRecordSchema,
    void
> {
    protected readonly schema = deleteRegistryRecordSchema

    constructor(
        private readonly type: RegistryRecordType,
        private readonly deleteRegistryRecordUseCase: DeleteRegistryRecordUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof deleteRegistryRecordSchema>,
    ): Promise<void> {
        return this.deleteRegistryRecordUseCase.execute({
            type: this.type,
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
        })
    }
}
