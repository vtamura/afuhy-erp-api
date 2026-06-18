import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { updateRegistryRecordSchema } from '../../../application/contracts'
import type { RegistryRecordResponseDto } from '../../../application/dto'
import type { UpdateRegistryRecordUseCase } from '../../../application/use-cases'
import type { RegistryRecordType } from '../../../domain/entities/registry-record.entity'

export class UpdateRegistryRecordController extends BaseController<
    typeof updateRegistryRecordSchema,
    RegistryRecordResponseDto
> {
    protected readonly schema = updateRegistryRecordSchema

    constructor(
        private readonly type: RegistryRecordType,
        private readonly updateRegistryRecordUseCase: UpdateRegistryRecordUseCase,
    ) {
        super()
    }

    protected execute(
        input: ControllerInput<typeof updateRegistryRecordSchema>,
    ): Promise<RegistryRecordResponseDto> {
        return this.updateRegistryRecordUseCase.execute({
            type: this.type,
            id: input.id,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            document: input.document,
            documentType: input.documentType ?? null,
            email: input.email,
            phone: input.phone,
            notes: input.notes,
            status: input.status,
        })
    }
}
