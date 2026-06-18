import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import { requireOrganization } from './financial-use-case.helpers'

export class DeleteFinancialAccountUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<void> {
        const organizationId = requireOrganization(input.organizationId)
        const account = await this.repository.findAccountById({
            id: input.id,
            organizationId,
        })
        if (!account) {
            throw new NotFoundError('Conta financeira nao encontrada')
        }
        if (
            await this.repository.accountHasTransactions({
                id: input.id,
                organizationId,
            })
        ) {
            throw new ConflictError(
                'Conta possui lancamentos e deve ser inativada',
            )
        }
        await this.repository.softDeleteAccount({
            id: input.id,
            organizationId,
        })
    }
}
