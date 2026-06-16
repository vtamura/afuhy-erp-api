import {
    BaseController,
    type ControllerInput,
} from '../../../../../shared/presentation/http/controllers'
import { createOrganizationSchema } from '../../../application/contracts'
import type { OrganizationResponseDto } from '../../../application/dto'
import type { CreateOrganizationUseCase } from '../../../application/use-cases'

export class CreateOrganizationController extends BaseController<
    typeof createOrganizationSchema,
    OrganizationResponseDto
> {
    protected readonly schema = createOrganizationSchema

    constructor(
        private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    ) {
        super()
    }

    protected async execute(
        input: ControllerInput<typeof createOrganizationSchema>,
    ) {
        const organization = await this.createOrganizationUseCase.execute({
            name: input.name,
            document: input.document,
            documentType: input.documentType,
            userId: input.authUser.userId,
        })

        return {
            statusCode: 201,
            body: organization,
        }
    }
}
