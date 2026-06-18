import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type {
    FinancialTransactionStatus,
    FinancialTransactionType,
} from '../../domain/entities/financial.entity'
import type {
    FinancialRepository,
    FinancialTransactionData,
    FinancialTransactionFilters,
} from '../../domain/repositories/financial.repository'
import type {
    FinancialTransactionListResponseDto,
    FinancialTransactionResponseDto,
} from '../dto'
import { toFinancialTransactionResponseDto } from '../mappers/financial-response.mapper'

type TransactionInput = Omit<
    FinancialTransactionData,
    'organizationId' | 'createdBy'
> & {
    organizationId: string | null
    createdBy: string
}

export class CreateFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(
        input: TransactionInput,
    ): Promise<FinancialTransactionResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        await validateTransactionReferences(this.repository, {
            ...input,
            organizationId,
        })
        const transaction = await this.repository.createTransaction({
            ...input,
            organizationId,
        })

        return toFinancialTransactionResponseDto(transaction)
    }
}

export class ListFinancialTransactionsUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(
        input: Omit<FinancialTransactionFilters, 'organizationId'> & {
            organizationId: string | null
            page: number
            pageSize: number
        },
    ): Promise<FinancialTransactionListResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const { page, pageSize, ...filters } = input
        const result = await this.repository.listTransactions(
            { ...filters, organizationId },
            { page, pageSize },
        )

        return {
            items: result.items.map(toFinancialTransactionResponseDto),
            pagination: {
                page,
                pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / pageSize),
            },
            summary: result.summary,
        }
    }
}

export class GetFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialTransactionResponseDto> {
        const transaction = await findTransactionOrThrow(this.repository, input)
        return toFinancialTransactionResponseDto(transaction)
    }
}

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

export class PayFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialTransactionResponseDto> {
        const current = await findTransactionOrThrow(this.repository, input)

        if (current.status !== 'PENDING') {
            throw new ConflictError(
                'Somente lancamentos pendentes podem ser pagos',
            )
        }

        return this.changeStatus(current.id, current.organizationId, 'PAID')
    }

    private async changeStatus(
        id: string,
        organizationId: string,
        status: 'PAID',
    ) {
        const updated = await this.repository.changeTransactionStatus({
            id,
            organizationId,
            status,
        })

        if (!updated) {
            throw new NotFoundError('Lancamento financeiro nao encontrado')
        }

        return toFinancialTransactionResponseDto(updated)
    }
}

export class CancelFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialTransactionResponseDto> {
        const current = await findTransactionOrThrow(this.repository, input)

        if (current.status === 'CANCELED') {
            throw new ConflictError('Lancamento ja esta cancelado')
        }

        const updated = await this.repository.changeTransactionStatus({
            id: current.id,
            organizationId: current.organizationId,
            status: 'CANCELED',
        })

        if (!updated) {
            throw new NotFoundError('Lancamento financeiro nao encontrado')
        }

        return toFinancialTransactionResponseDto(updated)
    }
}

export class DeleteFinancialTransactionUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<void> {
        const current = await findTransactionOrThrow(this.repository, input)

        if (current.status === 'PAID') {
            throw new ConflictError(
                'Lancamento pago deve ser cancelado antes da exclusao',
            )
        }

        await this.repository.softDeleteTransaction({
            id: current.id,
            organizationId: current.organizationId,
        })
    }
}

async function findTransactionOrThrow(
    repository: FinancialRepository,
    input: { id: string; organizationId: string | null },
) {
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

async function validateTransactionReferences(
    repository: FinancialRepository,
    input: FinancialTransactionData,
) {
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

function requireOrganization(organizationId: string | null): string {
    if (!organizationId) {
        throw new ForbiddenError('Organizacao nao selecionada')
    }

    return organizationId
}
