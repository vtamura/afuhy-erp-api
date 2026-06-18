import {
    BadRequestError,
    ConflictError,
} from '../../../../shared/domain/errors'
import type {
    FinancialAccountEntity,
    FinancialCategoryEntity,
    FinancialTransactionEntity,
    FinancialTransactionType,
} from '../../domain/entities/financial.entity'
import type {
    FinancialObligationEntity,
    FinancialObligationFilters,
    FinancialObligationRepository,
} from '../../domain/repositories/financial-obligation.repository'
import type {
    FinancialRepository,
    FinancialTransactionData,
} from '../../domain/repositories/financial.repository'
import {
    CancelFinancialObligationUseCase,
    CreateFinancialObligationUseCase,
    DeleteFinancialObligationUseCase,
    ListFinancialObligationsUseCase,
    SettleFinancialObligationUseCase,
    UpdateFinancialObligationUseCase,
} from '.'

const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'
const userId = '3ccbcefd-b996-4362-94bb-46955de8813e'
const clock = { now: () => new Date('2026-06-18T12:00:00.000Z') }

class InMemoryObligationRepository {
    accounts: FinancialAccountEntity[] = [
        this.account('account-1', organizationId),
    ]
    categories: FinancialCategoryEntity[] = [
        this.category('expense-1', organizationId, 'EXPENSE'),
        this.category('income-1', organizationId, 'INCOME'),
    ]
    transactions: FinancialTransactionEntity[] = []

    async findAccountById(input: { id: string; organizationId: string }) {
        return (
            this.accounts.find(
                (account) =>
                    account.id === input.id &&
                    account.organizationId === input.organizationId &&
                    !account.deletedAt,
            ) ?? null
        )
    }

    async findCategoryById(input: { id: string; organizationId: string }) {
        return (
            this.categories.find(
                (category) =>
                    category.id === input.id &&
                    category.organizationId === input.organizationId &&
                    !category.deletedAt,
            ) ?? null
        )
    }

    async counterpartyExists() {
        return true
    }

    async createTransaction(data: FinancialTransactionData) {
        const now = clock.now()
        const transaction: FinancialTransactionEntity = {
            id: `transaction-${this.transactions.length + 1}`,
            ...data,
            status: 'PENDING',
            paidAt: null,
            canceledAt: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }
        this.transactions.push(transaction)
        return transaction
    }

    async updateTransaction(input: {
        id: string
        organizationId: string
        data: Omit<FinancialTransactionData, 'organizationId' | 'createdBy'>
    }) {
        const transaction = this.findRaw(input)
        if (!transaction || transaction.status !== 'PENDING') return null
        Object.assign(transaction, input.data, { updatedAt: clock.now() })
        return transaction
    }

    async changeTransactionStatus(input: {
        id: string
        organizationId: string
        status: 'PAID' | 'CANCELED'
        settlementDate?: string
    }) {
        const transaction = this.findRaw(input)
        if (!transaction) return null
        transaction.status = input.status
        if (input.status === 'PAID') {
            transaction.transactionDate =
                input.settlementDate ?? transaction.transactionDate
            transaction.paidAt = clock.now()
        }
        if (input.status === 'CANCELED') {
            transaction.canceledAt = clock.now()
        }
        transaction.updatedAt = clock.now()
        return transaction
    }

    async softDeleteTransaction(input: { id: string; organizationId: string }) {
        const transaction = this.findRaw(input)
        if (!transaction) return false
        transaction.deletedAt = clock.now()
        return true
    }

    async findObligationById(input: {
        id: string
        organizationId: string
        type: FinancialTransactionType
        today: string
    }) {
        const transaction = this.findRaw(input)
        if (!transaction || transaction.type !== input.type) return null
        return this.enrich(transaction)
    }

    async listObligations(
        filters: FinancialObligationFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const items = this.transactions
            .filter((transaction) => {
                if (
                    transaction.organizationId !== filters.organizationId ||
                    transaction.type !== filters.type ||
                    transaction.deletedAt
                ) {
                    return false
                }
                if (filters.status && transaction.status !== filters.status) {
                    return false
                }
                if (
                    filters.overdue !== undefined &&
                    (transaction.status === 'PENDING' &&
                        transaction.dueDate! < filters.today) !==
                        filters.overdue
                ) {
                    return false
                }
                return true
            })
            .map((transaction) => this.enrich(transaction))
        const pending = items.filter((item) => item.status === 'PENDING')
        const settled = items.filter((item) => item.status === 'PAID')
        const overdue = pending.filter((item) => item.dueDate! < filters.today)
        const offset = (pagination.page - 1) * pagination.pageSize
        const sum = (values: FinancialObligationEntity[]) =>
            values
                .reduce((total, item) => total + Number(item.amount), 0)
                .toFixed(2)

        return {
            items: items.slice(offset, offset + pagination.pageSize),
            total: items.length,
            summary: {
                pendingCount: pending.length,
                pendingAmount: sum(pending),
                settledCount: settled.length,
                settledAmount: sum(settled),
                overdueCount: overdue.length,
                overdueAmount: sum(overdue),
            },
        }
    }

    private findRaw(input: { id: string; organizationId: string }) {
        return this.transactions.find(
            (transaction) =>
                transaction.id === input.id &&
                transaction.organizationId === input.organizationId &&
                !transaction.deletedAt,
        )
    }

    private enrich(
        transaction: FinancialTransactionEntity,
    ): FinancialObligationEntity {
        return {
            ...transaction,
            account: {
                id: transaction.accountId,
                name: 'Conta principal',
            },
            category: {
                id: transaction.categoryId,
                name: transaction.type === 'EXPENSE' ? 'Despesas' : 'Receitas',
            },
            counterparty:
                transaction.customerId || transaction.supplierId
                    ? {
                          id: transaction.customerId ?? transaction.supplierId!,
                          name: 'Contraparte',
                      }
                    : null,
        }
    }

    private account(
        id: string,
        inputOrganizationId: string,
    ): FinancialAccountEntity {
        return {
            id,
            organizationId: inputOrganizationId,
            name: 'Conta principal',
            type: 'BANK',
            initialBalance: '0.00',
            currentBalance: '0.00',
            projectedBalance: '0.00',
            status: 'ACTIVE',
            createdAt: clock.now(),
            updatedAt: clock.now(),
            deletedAt: null,
        }
    }

    private category(
        id: string,
        inputOrganizationId: string,
        type: FinancialTransactionType,
    ): FinancialCategoryEntity {
        return {
            id,
            organizationId: inputOrganizationId,
            name: type === 'EXPENSE' ? 'Despesas' : 'Receitas',
            type,
            status: 'ACTIVE',
            createdAt: clock.now(),
            updatedAt: clock.now(),
            deletedAt: null,
        }
    }
}

const repositories = () => {
    const repository = new InMemoryObligationRepository()
    return {
        repository: repository as unknown as FinancialRepository,
        obligationRepository:
            repository as unknown as FinancialObligationRepository,
    }
}

const input = (kind: 'payable' | 'receivable') => ({
    organizationId,
    createdBy: userId,
    accountId: 'account-1',
    categoryId: kind === 'payable' ? 'expense-1' : 'income-1',
    counterpartyId: null,
    description: kind === 'payable' ? 'Energia' : 'Venda',
    notes: null,
    amount: '100.00',
    transactionDate: '2026-06-01',
    dueDate: '2026-06-10',
})

function createUseCase(
    data: ReturnType<typeof repositories>,
    kind: 'payable' | 'receivable',
) {
    return new CreateFinancialObligationUseCase(
        data.repository,
        data.obligationRepository,
        clock,
        kind,
    )
}

describe('financial obligations use cases', () => {
    it('creates payables and receivables with their fixed transaction types', async () => {
        const data = repositories()
        const payable = await createUseCase(data, 'payable').execute(
            input('payable'),
        )
        const receivable = await createUseCase(data, 'receivable').execute(
            input('receivable'),
        )

        expect(payable.type).toBe('EXPENSE')
        expect(receivable.type).toBe('INCOME')
        expect(payable.account.name).toBe('Conta principal')
    })

    it('keeps lists isolated by obligation kind and reports overdue totals', async () => {
        const data = repositories()
        await createUseCase(data, 'payable').execute(input('payable'))
        await createUseCase(data, 'receivable').execute(input('receivable'))

        const result = await new ListFinancialObligationsUseCase(
            data.obligationRepository,
            clock,
            'payable',
        ).execute({
            organizationId,
            page: 1,
            pageSize: 20,
        })

        expect(result.items).toHaveLength(1)
        expect(result.items[0].type).toBe('EXPENSE')
        expect(result.summary.overdueAmount).toBe('100.00')
    })

    it('rejects due dates before the transaction date', async () => {
        const data = repositories()

        await expect(
            createUseCase(data, 'payable').execute({
                ...input('payable'),
                dueDate: '2026-05-31',
            }),
        ).rejects.toBeInstanceOf(BadRequestError)
    })

    it('updates pending obligations and settles using the informed date', async () => {
        const data = repositories()
        const created = await createUseCase(data, 'receivable').execute(
            input('receivable'),
        )
        const updated = await new UpdateFinancialObligationUseCase(
            data.repository,
            data.obligationRepository,
            clock,
            'receivable',
        ).execute({
            id: created.id,
            organizationId,
            amount: '125.00',
        })
        const settled = await new SettleFinancialObligationUseCase(
            data.repository,
            data.obligationRepository,
            clock,
            'receivable',
        ).execute({
            id: created.id,
            organizationId,
            settlementDate: '2026-06-15',
        })

        expect(updated.amount).toBe('125.00')
        expect(settled.status).toBe('PAID')
        expect(settled.transactionDate).toBe('2026-06-15')
    })

    it('requires cancellation before deleting a settled obligation', async () => {
        const data = repositories()
        const created = await createUseCase(data, 'payable').execute(
            input('payable'),
        )
        const settle = new SettleFinancialObligationUseCase(
            data.repository,
            data.obligationRepository,
            clock,
            'payable',
        )
        const remove = new DeleteFinancialObligationUseCase(
            data.repository,
            data.obligationRepository,
            clock,
            'payable',
        )
        await settle.execute({
            id: created.id,
            organizationId,
            settlementDate: '2026-06-15',
        })
        await expect(
            remove.execute({ id: created.id, organizationId }),
        ).rejects.toBeInstanceOf(ConflictError)

        await new CancelFinancialObligationUseCase(
            data.repository,
            data.obligationRepository,
            clock,
            'payable',
        ).execute({ id: created.id, organizationId })
        await expect(
            remove.execute({ id: created.id, organizationId }),
        ).resolves.toBeUndefined()
    })
})
