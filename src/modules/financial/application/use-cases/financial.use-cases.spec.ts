import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type {
    FinancialAccountEntity,
    FinancialCategoryEntity,
    FinancialTransactionEntity,
} from '../../domain/entities/financial.entity'
import { centsToMoney, moneyToCents } from '../../domain/money/money'
import type {
    FinancialAccountData,
    FinancialCategoryData,
    FinancialRepository,
    FinancialTransactionData,
    FinancialTransactionFilters,
} from '../../domain/repositories/financial.repository'
import {
    CancelFinancialTransactionUseCase,
    CreateFinancialAccountUseCase,
    CreateFinancialCategoryUseCase,
    CreateFinancialTransactionUseCase,
    DeleteFinancialAccountUseCase,
    DeleteFinancialTransactionUseCase,
    ListFinancialAccountsUseCase,
    ListFinancialTransactionsUseCase,
    PayFinancialTransactionUseCase,
    UpdateFinancialTransactionUseCase,
} from '.'

const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'
const otherOrganizationId = '77a4cace-b14f-4a0d-b7fa-406be4b139cc'
const userId = '3ccbcefd-b996-4362-94bb-46955de8813e'
const clock = { now: () => new Date('2026-06-18T12:00:00.000Z') }

class InMemoryFinancialRepository implements FinancialRepository {
    accounts: FinancialAccountEntity[] = []
    categories: FinancialCategoryEntity[] = []
    transactions: FinancialTransactionEntity[] = []
    counterparties = new Set<string>()

    async createAccount(data: FinancialAccountData) {
        const now = new Date()
        const account: FinancialAccountEntity = {
            id: `account-${this.accounts.length + 1}`,
            ...data,
            currentBalance: data.initialBalance,
            projectedBalance: data.initialBalance,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }
        this.accounts.push(account)
        return this.withBalances(account)
    }

    async listAccounts(inputOrganizationId: string) {
        return this.accounts
            .filter(
                (account) =>
                    account.organizationId === inputOrganizationId &&
                    !account.deletedAt,
            )
            .map((account) => this.withBalances(account))
    }

    async findAccountById(input: { id: string; organizationId: string }) {
        const account = this.accounts.find(
            (candidate) =>
                candidate.id === input.id &&
                candidate.organizationId === input.organizationId &&
                !candidate.deletedAt,
        )
        return account ? this.withBalances(account) : null
    }

    async updateAccount(input: {
        id: string
        organizationId: string
        data: Omit<FinancialAccountData, 'organizationId'>
    }) {
        const account = this.accounts.find(
            (candidate) =>
                candidate.id === input.id &&
                candidate.organizationId === input.organizationId &&
                !candidate.deletedAt,
        )
        if (!account) return null
        Object.assign(account, input.data, { updatedAt: new Date() })
        return this.withBalances(account)
    }

    async softDeleteAccount(input: { id: string; organizationId: string }) {
        const account = this.accounts.find(
            (candidate) =>
                candidate.id === input.id &&
                candidate.organizationId === input.organizationId &&
                !candidate.deletedAt,
        )
        if (!account) return false
        account.deletedAt = new Date()
        return true
    }

    async accountHasTransactions(input: {
        id: string
        organizationId: string
    }) {
        return this.transactions.some(
            (transaction) =>
                transaction.accountId === input.id &&
                transaction.organizationId === input.organizationId,
        )
    }

    async createCategory(data: FinancialCategoryData) {
        const now = new Date()
        const category: FinancialCategoryEntity = {
            id: `category-${this.categories.length + 1}`,
            ...data,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }
        this.categories.push(category)
        return category
    }

    async listCategories(inputOrganizationId: string) {
        return this.categories.filter(
            (category) =>
                category.organizationId === inputOrganizationId &&
                !category.deletedAt,
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

    async findCategoryByNameAndType(input: {
        organizationId: string
        name: string
        type: 'INCOME' | 'EXPENSE'
    }) {
        return (
            this.categories.find(
                (category) =>
                    category.organizationId === input.organizationId &&
                    category.name.toLowerCase() === input.name.toLowerCase() &&
                    category.type === input.type &&
                    !category.deletedAt,
            ) ?? null
        )
    }

    async updateCategory(input: {
        id: string
        organizationId: string
        data: Omit<FinancialCategoryData, 'organizationId'>
    }) {
        const category = await this.findCategoryById(input)
        if (!category) return null
        Object.assign(category, input.data, { updatedAt: new Date() })
        return category
    }

    async softDeleteCategory(input: { id: string; organizationId: string }) {
        const category = await this.findCategoryById(input)
        if (!category) return false
        category.deletedAt = new Date()
        return true
    }

    async categoryHasTransactions(input: {
        id: string
        organizationId: string
    }) {
        return this.transactions.some(
            (transaction) =>
                transaction.categoryId === input.id &&
                transaction.organizationId === input.organizationId,
        )
    }

    async createTransaction(data: FinancialTransactionData) {
        const now = new Date()
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

    async listTransactions(
        filters: FinancialTransactionFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const filtered = this.transactions.filter((transaction) => {
            if (
                transaction.organizationId !== filters.organizationId ||
                transaction.deletedAt
            )
                return false
            if (
                filters.accountId &&
                transaction.accountId !== filters.accountId
            )
                return false
            if (
                filters.categoryId &&
                transaction.categoryId !== filters.categoryId
            )
                return false
            if (
                filters.customerId &&
                transaction.customerId !== filters.customerId
            )
                return false
            if (
                filters.supplierId &&
                transaction.supplierId !== filters.supplierId
            )
                return false
            if (filters.type && transaction.type !== filters.type) return false
            if (filters.status && transaction.status !== filters.status)
                return false
            if (
                filters.startDate &&
                transaction.transactionDate < filters.startDate
            )
                return false
            if (
                filters.endDate &&
                transaction.transactionDate > filters.endDate
            )
                return false
            return true
        })
        const sum = (status: 'PAID' | 'PENDING', type: 'INCOME' | 'EXPENSE') =>
            centsToMoney(
                filtered
                    .filter(
                        (transaction) =>
                            transaction.status === status &&
                            transaction.type === type,
                    )
                    .reduce(
                        (total, transaction) =>
                            total + moneyToCents(transaction.amount),
                        0n,
                    ),
            )
        const offset = (pagination.page - 1) * pagination.pageSize

        return {
            items: filtered.slice(offset, offset + pagination.pageSize),
            total: filtered.length,
            summary: {
                paidIncome: sum('PAID', 'INCOME'),
                paidExpense: sum('PAID', 'EXPENSE'),
                pendingIncome: sum('PENDING', 'INCOME'),
                pendingExpense: sum('PENDING', 'EXPENSE'),
            },
        }
    }

    async findTransactionById(input: { id: string; organizationId: string }) {
        return (
            this.transactions.find(
                (transaction) =>
                    transaction.id === input.id &&
                    transaction.organizationId === input.organizationId &&
                    !transaction.deletedAt,
            ) ?? null
        )
    }

    async updateTransaction(input: {
        id: string
        organizationId: string
        data: Omit<FinancialTransactionData, 'organizationId' | 'createdBy'>
    }) {
        const transaction = await this.findTransactionById(input)
        if (!transaction || transaction.status !== 'PENDING') return null
        Object.assign(transaction, input.data, { updatedAt: new Date() })
        return transaction
    }

    async changeTransactionStatus(input: {
        id: string
        organizationId: string
        status: 'PAID' | 'CANCELED'
        settlementDate?: string
    }) {
        const transaction = await this.findTransactionById(input)
        if (!transaction) return null
        transaction.status = input.status
        if (input.status === 'PAID' && input.settlementDate) {
            transaction.transactionDate = input.settlementDate
        }
        transaction.paidAt =
            input.status === 'PAID' ? new Date() : transaction.paidAt
        transaction.canceledAt = input.status === 'CANCELED' ? new Date() : null
        transaction.updatedAt = new Date()
        return transaction
    }

    async softDeleteTransaction(input: { id: string; organizationId: string }) {
        const transaction = await this.findTransactionById(input)
        if (!transaction) return false
        transaction.deletedAt = new Date()
        return true
    }

    async counterpartyExists(input: {
        type: 'customer' | 'supplier'
        id: string
        organizationId: string
    }) {
        return this.counterparties.has(
            `${input.type}:${input.organizationId}:${input.id}`,
        )
    }

    private withBalances(
        account: FinancialAccountEntity,
    ): FinancialAccountEntity {
        let current = moneyToCents(account.initialBalance)
        let projected = current
        for (const transaction of this.transactions) {
            if (
                transaction.accountId !== account.id ||
                transaction.organizationId !== account.organizationId ||
                transaction.deletedAt ||
                transaction.status === 'CANCELED'
            )
                continue
            const amount =
                transaction.type === 'INCOME'
                    ? moneyToCents(transaction.amount)
                    : -moneyToCents(transaction.amount)
            if (transaction.status === 'PAID') current += amount
            if (
                transaction.status === 'PAID' ||
                transaction.status === 'PENDING'
            )
                projected += amount
        }
        return {
            ...account,
            currentBalance: centsToMoney(current),
            projectedBalance: centsToMoney(projected),
        }
    }
}

async function setup(repository = new InMemoryFinancialRepository()) {
    const account = await new CreateFinancialAccountUseCase(repository).execute(
        {
            organizationId,
            name: 'Conta principal',
            type: 'BANK',
            initialBalance: '100.00',
            status: 'ACTIVE',
        },
    )
    const income = await new CreateFinancialCategoryUseCase(repository).execute(
        {
            organizationId,
            name: 'Vendas',
            type: 'INCOME',
            status: 'ACTIVE',
        },
    )
    const expense = await new CreateFinancialCategoryUseCase(
        repository,
    ).execute({
        organizationId,
        name: 'Despesas',
        type: 'EXPENSE',
        status: 'ACTIVE',
    })
    return { repository, account, income, expense }
}

function transactionInput(
    setupData: Awaited<ReturnType<typeof setup>>,
    overrides: Partial<FinancialTransactionData> = {},
) {
    return {
        organizationId,
        createdBy: userId,
        accountId: setupData.account.id,
        categoryId: setupData.income.id,
        customerId: null,
        supplierId: null,
        description: 'Venda',
        notes: null,
        type: 'INCOME' as const,
        amount: '50.00',
        transactionDate: '2026-06-17',
        dueDate: null,
        ...overrides,
    }
}

describe('Financial use cases', () => {
    it('isolates accounts by tenant', async () => {
        const repository = new InMemoryFinancialRepository()
        const create = new CreateFinancialAccountUseCase(repository)
        await create.execute({
            organizationId,
            name: 'Conta A',
            type: 'CASH',
            initialBalance: '0.00',
            status: 'ACTIVE',
        })
        await create.execute({
            organizationId: otherOrganizationId,
            name: 'Conta B',
            type: 'BANK',
            initialBalance: '0.00',
            status: 'ACTIVE',
        })

        const result = await new ListFinancialAccountsUseCase(
            repository,
        ).execute({ organizationId })
        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('Conta A')
    })

    it('blocks duplicated category name and type in the tenant', async () => {
        const repository = new InMemoryFinancialRepository()
        const create = new CreateFinancialCategoryUseCase(repository)
        await create.execute({
            organizationId,
            name: 'Vendas',
            type: 'INCOME',
            status: 'ACTIVE',
        })

        await expect(
            create.execute({
                organizationId,
                name: 'vendas',
                type: 'INCOME',
                status: 'ACTIVE',
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('validates category type and counterparty tenant', async () => {
        const data = await setup()
        const create = new CreateFinancialTransactionUseCase(data.repository)

        await expect(
            create.execute(
                transactionInput(data, {
                    categoryId: data.expense.id,
                }),
            ),
        ).rejects.toBeInstanceOf(BadRequestError)

        await expect(
            create.execute(
                transactionInput(data, {
                    customerId: 'customer-1',
                }),
            ),
        ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('calculates current and projected balances', async () => {
        const data = await setup()
        const create = new CreateFinancialTransactionUseCase(data.repository)
        const pay = new PayFinancialTransactionUseCase(data.repository, clock)
        const paid = await create.execute(transactionInput(data))
        await pay.execute({ id: paid.id, organizationId })
        await create.execute(
            transactionInput(data, {
                categoryId: data.expense.id,
                description: 'Conta pendente',
                type: 'EXPENSE',
                amount: '20.00',
            }),
        )

        const [account] = await new ListFinancialAccountsUseCase(
            data.repository,
        ).execute({ organizationId })
        expect(account.currentBalance).toBe('150.00')
        expect(account.projectedBalance).toBe('130.00')
    })

    it('paginates transactions and summarizes the complete filter', async () => {
        const data = await setup()
        const create = new CreateFinancialTransactionUseCase(data.repository)
        const pay = new PayFinancialTransactionUseCase(data.repository, clock)
        const first = await create.execute(transactionInput(data))
        await pay.execute({ id: first.id, organizationId })
        await create.execute(
            transactionInput(data, {
                description: 'Venda futura',
                amount: '30.00',
            }),
        )

        const result = await new ListFinancialTransactionsUseCase(
            data.repository,
        ).execute({
            organizationId,
            page: 1,
            pageSize: 1,
            type: 'INCOME',
        })
        expect(result.items).toHaveLength(1)
        expect(result.pagination).toMatchObject({ total: 2, totalPages: 2 })
        expect(result.summary).toMatchObject({
            paidIncome: '50.00',
            pendingIncome: '30.00',
        })
    })

    it('blocks editing and deleting paid transactions until cancellation', async () => {
        const data = await setup()
        const create = new CreateFinancialTransactionUseCase(data.repository)
        const created = await create.execute(transactionInput(data))
        await new PayFinancialTransactionUseCase(
            data.repository,
            clock,
        ).execute({
            id: created.id,
            organizationId,
        })

        await expect(
            new UpdateFinancialTransactionUseCase(data.repository).execute({
                id: created.id,
                organizationId,
                description: 'Correcao',
            }),
        ).rejects.toBeInstanceOf(ConflictError)
        await expect(
            new DeleteFinancialTransactionUseCase(data.repository).execute({
                id: created.id,
                organizationId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('cancels a paid transaction and allows soft delete', async () => {
        const data = await setup()
        const created = await new CreateFinancialTransactionUseCase(
            data.repository,
        ).execute(transactionInput(data))
        await new PayFinancialTransactionUseCase(
            data.repository,
            clock,
        ).execute({
            id: created.id,
            organizationId,
        })
        const canceled = await new CancelFinancialTransactionUseCase(
            data.repository,
        ).execute({ id: created.id, organizationId })
        await new DeleteFinancialTransactionUseCase(data.repository).execute({
            id: created.id,
            organizationId,
        })

        expect(canceled.status).toBe('CANCELED')
        expect(
            await data.repository.findTransactionById({
                id: created.id,
                organizationId,
            }),
        ).toBeNull()
    })

    it('blocks deleting an account referenced by transactions', async () => {
        const data = await setup()
        await new CreateFinancialTransactionUseCase(data.repository).execute(
            transactionInput(data),
        )

        await expect(
            new DeleteFinancialAccountUseCase(data.repository).execute({
                id: data.account.id,
                organizationId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })
})
