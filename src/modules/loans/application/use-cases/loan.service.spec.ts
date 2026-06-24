import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { LoanEntity } from '../../domain/entities/loan.entity'
import type {
    LoanChargeData,
    LoanRepository,
} from '../../domain/repositories/loan.repository'
import { LoanService } from './loan.service'

const organizationId = '11111111-1111-4111-8111-111111111111'
const userId = '22222222-2222-4222-8222-222222222222'
const loanId = '33333333-3333-4333-8333-333333333333'
const customerId = '44444444-4444-4444-8444-444444444444'
const employeeId = '55555555-5555-4555-8555-555555555555'
const variantId = '66666666-6666-4666-8666-666666666666'
const categoryId = '77777777-7777-4777-8777-777777777777'

const makeLoan = (overrides: Partial<LoanEntity> = {}): LoanEntity => ({
    id: loanId,
    organizationId,
    borrowerType: 'CUSTOMER',
    customerId,
    customerName: 'Cliente',
    employeeId: null,
    employeeName: null,
    status: 'DRAFT',
    expectedReturnDate: '2026-07-10',
    isOverdue: false,
    releasedAt: null,
    completedAt: null,
    canceledAt: null,
    notes: null,
    createdBy: userId,
    creatorName: 'Usuario',
    createdAt: new Date('2026-06-23T00:00:00.000Z'),
    updatedAt: new Date('2026-06-23T00:00:00.000Z'),
    deletedAt: null,
    items: [
        {
            id: '88888888-8888-4888-8888-888888888888',
            organizationId,
            loanId,
            variantId,
            productName: 'Notebook',
            variantName: 'Dell',
            variantSku: 'NOTE-1',
            quantityReleased: '1.000',
            quantityReturned: '0.000',
            quantityLost: '0.000',
            quantityDamaged: '0.000',
            pendingQuantity: '1.000',
            unitCostSnapshot: '1000.00',
            notes: null,
        },
    ],
    returns: [],
    occurrences: [],
    charges: [],
    ...overrides,
})

class FakeLoanRepository implements LoanRepository {
    loan = makeLoan()
    activeCustomer = true
    activeEmployee = true
    activeCategory = true
    releasedInput: { initialCharge: LoanChargeData | null } | null = null

    async createLoan() {
        return this.loan
    }
    async listLoans() {
        return { items: [this.loan], total: 1 }
    }
    async findLoanById() {
        return this.loan
    }
    async updateDraft() {
        return this.loan
    }
    async releaseLoan(input: { initialCharge: LoanChargeData | null }) {
        this.releasedInput = input
        return makeLoan({ status: 'RELEASED', releasedAt: new Date() })
    }
    async cancelDraft() {
        return makeLoan({ status: 'CANCELED', canceledAt: new Date() })
    }
    async createReturn() {
        return this.loan
    }
    async createOccurrence() {
        return this.loan
    }
    async createCharge() {
        return this.loan
    }
    async cancelCharge() {
        return this.loan
    }
    async customerIsActive() {
        return this.activeCustomer
    }
    async employeeIsActive() {
        return this.activeEmployee
    }
    async incomeCategoryIsActive() {
        return this.activeCategory
    }
}

describe('LoanService', () => {
    it('cria emprestimo para cliente ativo', async () => {
        const repository = new FakeLoanRepository()
        const service = new LoanService(repository)

        const result = await service.create({
            organizationId,
            borrowerType: 'CUSTOMER',
            customerId,
            employeeId: null,
            expectedReturnDate: '2026-07-10',
            notes: null,
            items: [{ variantId, quantity: '1.000', notes: null }],
            createdBy: userId,
        })

        expect(result.id).toBe(loanId)
        expect(result.borrowerType).toBe('CUSTOMER')
    })

    it('bloqueia tomador inativo', async () => {
        const repository = new FakeLoanRepository()
        repository.activeCustomer = false
        const service = new LoanService(repository)

        await expect(
            service.create({
                organizationId,
                borrowerType: 'CUSTOMER',
                customerId,
                employeeId: null,
                expectedReturnDate: '2026-07-10',
                notes: null,
                items: [{ variantId, quantity: '1.000', notes: null }],
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('bloqueia liberacao fora de rascunho', async () => {
        const repository = new FakeLoanRepository()
        repository.loan = makeLoan({ status: 'RELEASED' })
        const service = new LoanService(repository)

        await expect(
            service.release({
                id: loanId,
                organizationId,
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('exige categoria ativa para taxa de liberacao', async () => {
        const repository = new FakeLoanRepository()
        repository.activeCategory = false
        const service = new LoanService(repository)

        await expect(
            service.release({
                id: loanId,
                organizationId,
                createdBy: userId,
                feeAmount: '10.00',
                feeCategoryId: categoryId,
                feeDueDate: '2026-07-10',
            }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('envia cobranca inicial ao liberar rascunho', async () => {
        const repository = new FakeLoanRepository()
        const service = new LoanService(repository)

        await service.release({
            id: loanId,
            organizationId,
            createdBy: userId,
            feeAmount: '10.00',
            feeCategoryId: categoryId,
            feeDueDate: '2026-07-10',
            feeDescription: 'Taxa inicial',
        })

        expect(repository.releasedInput?.initialCharge).toMatchObject({
            type: 'FEE',
            categoryId,
            amount: '10.00',
            dueDate: '2026-07-10',
            description: 'Taxa inicial',
        })
    })

    it('bloqueia devolucao em rascunho', async () => {
        const repository = new FakeLoanRepository()
        const service = new LoanService(repository)

        await expect(
            service.createReturn({
                id: loanId,
                organizationId,
                notes: null,
                createdBy: userId,
                items: [
                    {
                        loanItemId: '88888888-8888-4888-8888-888888888888',
                        quantity: '1.000',
                    },
                ],
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })
})
