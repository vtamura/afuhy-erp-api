import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type {
    FinancialAccountType,
    FinancialResourceStatus,
} from '../../domain/entities/financial.entity'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialAccountResponseDto } from '../dto'
import { toFinancialAccountResponseDto } from '../mappers/financial-response.mapper'

type AccountInput = {
    organizationId: string | null
    name: string
    type: FinancialAccountType
    initialBalance: string
    status: FinancialResourceStatus
}

export class CreateFinancialAccountUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: AccountInput): Promise<FinancialAccountResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const account = await this.repository.createAccount({
            ...input,
            organizationId,
        })

        return toFinancialAccountResponseDto(account)
    }
}

export class ListFinancialAccountsUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        organizationId: string | null
    }): Promise<FinancialAccountResponseDto[]> {
        const organizationId = requireOrganization(input.organizationId)
        const accounts = await this.repository.listAccounts(organizationId)
        return accounts.map(toFinancialAccountResponseDto)
    }
}

export class GetFinancialAccountUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialAccountResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const account = await this.repository.findAccountById({
            id: input.id,
            organizationId,
        })

        if (!account) {
            throw new NotFoundError('Conta financeira nao encontrada')
        }

        return toFinancialAccountResponseDto(account)
    }
}

export class UpdateFinancialAccountUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
        name?: string
        type?: FinancialAccountType
        initialBalance?: string
        status?: FinancialResourceStatus
    }): Promise<FinancialAccountResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const current = await this.repository.findAccountById({
            id: input.id,
            organizationId,
        })

        if (!current) {
            throw new NotFoundError('Conta financeira nao encontrada')
        }

        const updated = await this.repository.updateAccount({
            id: input.id,
            organizationId,
            data: {
                name: input.name ?? current.name,
                type: input.type ?? current.type,
                initialBalance: input.initialBalance ?? current.initialBalance,
                status: input.status ?? current.status,
            },
        })

        if (!updated) {
            throw new NotFoundError('Conta financeira nao encontrada')
        }

        return toFinancialAccountResponseDto(updated)
    }
}

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

function requireOrganization(organizationId: string | null): string {
    if (!organizationId) {
        throw new ForbiddenError('Organizacao nao selecionada')
    }

    return organizationId
}
