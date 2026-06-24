import {
    BadRequestError,
    ConflictError,
    NotFoundError,
    UnauthorizedError,
} from '../../../../shared/domain/errors'
import type {
    LoanBorrowerType,
    LoanChargeType,
    LoanOccurrenceType,
} from '../../domain/entities/loan.entity'
import type {
    LoanChargeData,
    LoanItemData,
    LoanRepository,
} from '../../domain/repositories/loan.repository'
import { toLoanResponseDto } from '../mappers/loan-response.mapper'

const requireOrganization = (organizationId: string | null) => {
    if (!organizationId)
        throw new UnauthorizedError('Organizacao ativa obrigatoria')
    return organizationId
}

const todayDate = () => new Date().toISOString().slice(0, 10)
const atDate = (date?: string) =>
    new Date(`${date ?? todayDate()}T00:00:00.000Z`)

export class LoanService {
    constructor(private readonly repository: LoanRepository) {}

    private async validateBorrower(input: {
        organizationId: string
        borrowerType: LoanBorrowerType
        customerId: string | null
        employeeId: string | null
    }) {
        if (input.borrowerType === 'CUSTOMER') {
            if (!input.customerId || input.employeeId)
                throw new BadRequestError('Cliente deve ser informado')
            if (
                !(await this.repository.customerIsActive({
                    id: input.customerId,
                    organizationId: input.organizationId,
                }))
            )
                throw new NotFoundError('Cliente ativo nao encontrado')
            return
        }
        if (!input.employeeId || input.customerId)
            throw new BadRequestError('Funcionario deve ser informado')
        if (
            !(await this.repository.employeeIsActive({
                id: input.employeeId,
                organizationId: input.organizationId,
            }))
        )
            throw new NotFoundError('Funcionario ativo nao encontrado')
    }

    private async validateCharge(
        organizationId: string,
        charge: LoanChargeData,
    ) {
        if (
            !(await this.repository.incomeCategoryIsActive({
                id: charge.categoryId,
                organizationId,
            }))
        )
            throw new NotFoundError('Categoria de receita ativa nao encontrada')
    }

    private async loanOrThrow(input: {
        id: string
        organizationId: string | null
    }) {
        const loan = await this.repository.findLoanById({
            id: input.id,
            organizationId: requireOrganization(input.organizationId),
        })
        if (!loan) throw new NotFoundError('Emprestimo nao encontrado')
        return loan
    }

    async create(input: {
        organizationId: string | null
        borrowerType: LoanBorrowerType
        customerId: string | null
        employeeId: string | null
        expectedReturnDate: string
        notes: string | null
        items: LoanItemData[]
        createdBy: string
    }) {
        const organizationId = requireOrganization(input.organizationId)
        await this.validateBorrower({ ...input, organizationId })
        return toLoanResponseDto(
            await this.repository.createLoan({ ...input, organizationId }),
        )
    }

    async list(input: {
        organizationId: string | null
        status?: Parameters<LoanRepository['listLoans']>[0]['status']
        borrowerType?: LoanBorrowerType
        borrowerId?: string
        overdue?: boolean
        search?: string
        startDate?: string
        endDate?: string
        page: number
        pageSize: number
    }) {
        const organizationId = requireOrganization(input.organizationId)
        const { page, pageSize, ...filters } = input
        const result = await this.repository.listLoans(
            { ...filters, organizationId },
            { page, pageSize },
        )
        return {
            items: result.items.map(toLoanResponseDto),
            pagination: {
                page,
                pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / pageSize),
            },
        }
    }

    async get(input: { id: string; organizationId: string | null }) {
        return toLoanResponseDto(await this.loanOrThrow(input))
    }

    async update(input: {
        id: string
        organizationId: string | null
        borrowerType?: LoanBorrowerType
        customerId?: string | null
        employeeId?: string | null
        expectedReturnDate?: string
        notes?: string | null
        items?: LoanItemData[]
    }) {
        const current = await this.loanOrThrow(input)
        if (current.status !== 'DRAFT')
            throw new ConflictError(
                'Somente emprestimos em rascunho podem ser alterados',
            )
        const borrowerType = input.borrowerType ?? current.borrowerType
        const customerId =
            input.customerId === undefined
                ? current.customerId
                : input.customerId
        const employeeId =
            input.employeeId === undefined
                ? current.employeeId
                : input.employeeId
        await this.validateBorrower({
            organizationId: current.organizationId,
            borrowerType,
            customerId,
            employeeId,
        })
        const updated = await this.repository.updateDraft({
            id: current.id,
            organizationId: current.organizationId,
            borrowerType,
            customerId,
            employeeId,
            expectedReturnDate:
                input.expectedReturnDate ?? current.expectedReturnDate,
            notes: input.notes === undefined ? current.notes : input.notes,
            items:
                input.items ??
                current.items.map((item) => ({
                    variantId: item.variantId,
                    quantity: item.quantityReleased,
                    notes: item.notes,
                })),
        })
        if (!updated) throw new NotFoundError('Emprestimo nao encontrado')
        return toLoanResponseDto(updated)
    }

    async release(input: {
        id: string
        organizationId: string | null
        releasedAt?: string
        createdBy: string
        feeAmount?: string
        feeCategoryId?: string
        feeDueDate?: string
        feeDescription?: string
        idempotencyKey?: string
    }) {
        const current = await this.loanOrThrow(input)
        if (current.status !== 'DRAFT')
            throw new ConflictError(
                'Somente emprestimos em rascunho podem ser liberados',
            )
        let initialCharge: LoanChargeData | null = null
        if (
            input.feeAmount ||
            input.feeCategoryId ||
            input.feeDueDate ||
            input.feeDescription
        ) {
            if (!input.feeAmount || !input.feeCategoryId || !input.feeDueDate)
                throw new BadRequestError(
                    'Valor, categoria e vencimento da taxa sao obrigatorios',
                )
            initialCharge = {
                type: 'FEE',
                categoryId: input.feeCategoryId,
                amount: input.feeAmount,
                dueDate: input.feeDueDate,
                description:
                    input.feeDescription ?? `Taxa do emprestimo ${current.id}`,
                occurrenceId: null,
                idempotencyKey: input.idempotencyKey ?? null,
            }
            await this.validateCharge(current.organizationId, initialCharge)
        }
        return toLoanResponseDto(
            await this.repository.releaseLoan({
                id: current.id,
                organizationId: current.organizationId,
                releasedAt: atDate(input.releasedAt),
                createdBy: input.createdBy,
                initialCharge,
            }),
        )
    }

    async cancel(input: { id: string; organizationId: string | null }) {
        const current = await this.loanOrThrow(input)
        if (current.status !== 'DRAFT')
            throw new ConflictError(
                'Somente emprestimos em rascunho podem ser cancelados',
            )
        const canceled = await this.repository.cancelDraft({
            id: current.id,
            organizationId: current.organizationId,
        })
        if (!canceled) throw new NotFoundError('Emprestimo nao encontrado')
        return toLoanResponseDto(canceled)
    }

    async createReturn(input: {
        id: string
        organizationId: string | null
        returnedAt?: string
        notes: string | null
        idempotencyKey?: string
        createdBy: string
        items: Array<{ loanItemId: string; quantity: string }>
    }) {
        const current = await this.loanOrThrow(input)
        if (!['RELEASED', 'PARTIALLY_RETURNED'].includes(current.status))
            throw new ConflictError(
                'Somente emprestimos liberados podem receber devolucao',
            )
        return toLoanResponseDto(
            await this.repository.createReturn({
                id: current.id,
                organizationId: current.organizationId,
                returnedAt: atDate(input.returnedAt),
                notes: input.notes,
                idempotencyKey: input.idempotencyKey ?? null,
                createdBy: input.createdBy,
                items: input.items,
            }),
        )
    }

    async createOccurrence(input: {
        id: string
        organizationId: string | null
        type: LoanOccurrenceType
        occurredAt?: string
        description: string | null
        idempotencyKey?: string
        createdBy: string
        items: Array<{ loanItemId: string; quantity: string }>
        charge?: {
            type: LoanChargeType
            categoryId: string
            amount: string
            dueDate: string
            description: string
            idempotencyKey?: string
        }
    }) {
        const current = await this.loanOrThrow(input)
        if (!['RELEASED', 'PARTIALLY_RETURNED'].includes(current.status))
            throw new ConflictError(
                'Somente emprestimos liberados aceitam ocorrencias',
            )
        const charge = input.charge
            ? {
                  ...input.charge,
                  occurrenceId: null,
                  idempotencyKey: input.charge.idempotencyKey ?? null,
              }
            : null
        if (charge) await this.validateCharge(current.organizationId, charge)
        return toLoanResponseDto(
            await this.repository.createOccurrence({
                id: current.id,
                organizationId: current.organizationId,
                type: input.type,
                occurredAt: atDate(input.occurredAt),
                description: input.description,
                idempotencyKey: input.idempotencyKey ?? null,
                createdBy: input.createdBy,
                items: input.items,
                charge,
            }),
        )
    }

    async createCharge(input: {
        id: string
        organizationId: string | null
        createdBy: string
        type: LoanChargeType
        categoryId: string
        amount: string
        dueDate: string
        description: string
        idempotencyKey?: string
    }) {
        const current = await this.loanOrThrow(input)
        if (current.status === 'DRAFT' || current.status === 'CANCELED')
            throw new ConflictError(
                'Cobrancas exigem emprestimo liberado ou concluido',
            )
        const charge: LoanChargeData = {
            type: input.type,
            categoryId: input.categoryId,
            amount: input.amount,
            dueDate: input.dueDate,
            description: input.description,
            occurrenceId: null,
            idempotencyKey: input.idempotencyKey ?? null,
        }
        await this.validateCharge(current.organizationId, charge)
        return toLoanResponseDto(
            await this.repository.createCharge({
                id: current.id,
                organizationId: current.organizationId,
                createdBy: input.createdBy,
                charge,
            }),
        )
    }

    async cancelCharge(input: {
        id: string
        chargeId: string
        organizationId: string | null
    }) {
        const current = await this.loanOrThrow(input)
        return toLoanResponseDto(
            await this.repository.cancelCharge({
                id: current.id,
                chargeId: input.chargeId,
                organizationId: current.organizationId,
            }),
        )
    }
}
