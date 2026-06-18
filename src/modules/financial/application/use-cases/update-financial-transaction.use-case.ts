import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type {
    FinancialRepository,
    FinancialTransactionData,
} from '../../domain/repositories/financial.repository'
import type { FinancialTransactionResponseDto } from '../dto'
import { toFinancialTransactionResponseDto } from '../mappers/financial-response.mapper'
import {
    findTransactionOrThrow,
    validateTransactionReferences,
} from './financial-use-case.helpers'

export class UpdateFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(
        input: {
            id: string
            organizationId: string | null
        } & Partial<
            Omit<FinancialTransactionData, 'organizationId' | 'createdBy'>
        >,
    ): Promise<FinancialTransactionResponseDto> {
        const current = await findTransactionOrThrow(this.repository, input)
        if (current.status !== 'PENDING') {
            throw new ConflictError(
                'Somente lancamentos pendentes podem ser editados',
            )
        }
        const data = {
            accountId: input.accountId ?? current.accountId,
            categoryId: input.categoryId ?? current.categoryId,
            customerId:
                input.customerId === undefined
                    ? current.customerId
                    : input.customerId,
            supplierId:
                input.supplierId === undefined
                    ? current.supplierId
                    : input.supplierId,
            description: input.description ?? current.description,
            notes: input.notes === undefined ? current.notes : input.notes,
            type: input.type ?? current.type,
            amount: input.amount ?? current.amount,
            transactionDate: input.transactionDate ?? current.transactionDate,
            dueDate:
                input.dueDate === undefined ? current.dueDate : input.dueDate,
        }
        await validateTransactionReferences(this.repository, {
            ...data,
            organizationId: current.organizationId,
            createdBy: current.createdBy,
        })
        const updated = await this.repository.updateTransaction({
            id: input.id,
            organizationId: current.organizationId,
            data,
        })
        if (!updated) {
            throw new NotFoundError('Lancamento financeiro nao encontrado')
        }
        return toFinancialTransactionResponseDto(updated)
    }
}
