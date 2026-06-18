import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type { FinancialTransactionEntity } from '../../domain/entities/financial.entity'
import type {
    FinancialRepository,
    FinancialTransactionData,
} from '../../domain/repositories/financial.repository'

export function requireOrganization(organizationId: string | null): string {
    if (!organizationId) {
        throw new ForbiddenError('Organizacao nao selecionada')
    }

    return organizationId
}

export async function findTransactionOrThrow(
    repository: FinancialRepository,
    input: { id: string; organizationId: string | null },
): Promise<FinancialTransactionEntity> {
    const organizationId = requireOrganization(input.organizationId)
    const transaction = await repository.findTransactionById({
        id: input.id,
        organizationId,
    })

    if (!transaction) {
        throw new NotFoundError('Lancamento financeiro nao encontrado')
    }

    return transaction
}

export async function validateTransactionReferences(
    repository: FinancialRepository,
    input: FinancialTransactionData,
): Promise<void> {
    if (input.customerId && input.supplierId) {
        throw new BadRequestError(
            'Cliente e fornecedor nao podem ser informados juntos',
        )
    }

    const account = await repository.findAccountById({
        id: input.accountId,
        organizationId: input.organizationId,
    })
    if (!account || account.status !== 'ACTIVE') {
        throw new NotFoundError('Conta financeira ativa nao encontrada')
    }

    const category = await repository.findCategoryById({
        id: input.categoryId,
        organizationId: input.organizationId,
    })
    if (!category || category.status !== 'ACTIVE') {
        throw new NotFoundError('Categoria financeira ativa nao encontrada')
    }
    if (category.type !== input.type) {
        throw new BadRequestError(
            'Tipo da categoria nao corresponde ao lancamento',
        )
    }

    if (
        input.customerId &&
        !(await repository.counterpartyExists({
            type: 'customer',
            id: input.customerId,
            organizationId: input.organizationId,
        }))
    ) {
        throw new NotFoundError('Cliente ativo nao encontrado')
    }

    if (
        input.supplierId &&
        !(await repository.counterpartyExists({
            type: 'supplier',
            id: input.supplierId,
            organizationId: input.organizationId,
        }))
    ) {
        throw new NotFoundError('Fornecedor ativo nao encontrado')
    }
}
