import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createRegistryRecordSchema } from '../../../application/contracts'
import type { RegistryRecordResponseDto } from '../../../application/dto'
import type { CreateRegistryRecordUseCase } from '../../../application/use-cases'
import type { RegistryRecordType } from '../../../domain/entities/registry-record.entity'

type CreateRegistryRecordResponse = {
    statusCode: number
    body: RegistryRecordResponseDto
}

export class CreateRegistryRecordController extends BaseController<
    typeof createRegistryRecordSchema,
    RegistryRecordResponseDto
> {
    protected readonly schema = createRegistryRecordSchema

    constructor(
        private readonly type: RegistryRecordType,
        private readonly createRegistryRecordUseCase: CreateRegistryRecordUseCase,
    ) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof createRegistryRecordSchema>,
    ): Promise<CreateRegistryRecordResponse> {
        const body = await this.createRegistryRecordUseCase.execute({
            type: this.type,
            organizationId: input.authUser.organizationId ?? null,
            name: input.name,
            document: input.document,
            documentType: input.documentType ?? null,
            email: input.email,
            phone: input.phone,
            notes: input.notes,
            status: input.status,
        })

        return {
            statusCode: 201,
            body,
        }
    }
}
