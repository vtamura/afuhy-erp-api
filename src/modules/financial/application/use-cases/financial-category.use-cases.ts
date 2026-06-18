import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import type {
    FinancialResourceStatus,
    FinancialTransactionType,
} from '../../domain/entities/financial.entity'
import type { FinancialRepository } from '../../domain/repositories/financial.repository'
import type { FinancialCategoryResponseDto } from '../dto'
import { toFinancialCategoryResponseDto } from '../mappers/financial-response.mapper'

type CategoryInput = {
    organizationId: string | null
    name: string
    type: FinancialTransactionType
    status: FinancialResourceStatus
}

export class CreateFinancialCategoryUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: CategoryInput): Promise<FinancialCategoryResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        await ensureUniqueCategory(this.repository, {
            organizationId,
            name: input.name,
            type: input.type,
        })
        const category = await this.repository.createCategory({
            ...input,
            organizationId,
        })

        return toFinancialCategoryResponseDto(category)
    }
}

export class ListFinancialCategoriesUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        organizationId: string | null
    }): Promise<FinancialCategoryResponseDto[]> {
        const organizationId = requireOrganization(input.organizationId)
        const categories = await this.repository.listCategories(organizationId)
        return categories.map(toFinancialCategoryResponseDto)
    }
}

export class GetFinancialCategoryUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<FinancialCategoryResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const category = await this.repository.findCategoryById({
            id: input.id,
            organizationId,
        })

        if (!category) {
            throw new NotFoundError('Categoria financeira nao encontrada')
        }

        return toFinancialCategoryResponseDto(category)
    }
}

export class UpdateFinancialCategoryUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
        name?: string
        type?: FinancialTransactionType
        status?: FinancialResourceStatus
    }): Promise<FinancialCategoryResponseDto> {
        const organizationId = requireOrganization(input.organizationId)
        const current = await this.repository.findCategoryById({
            id: input.id,
            organizationId,
        })

        if (!current) {
            throw new NotFoundError('Categoria financeira nao encontrada')
        }

        const name = input.name ?? current.name
        const type = input.type ?? current.type
        const duplicate = await this.repository.findCategoryByNameAndType({
            organizationId,
            name,
            type,
        })

        if (duplicate && duplicate.id !== input.id) {
            throw new ConflictError('Categoria financeira ja cadastrada')
        }

        const updated = await this.repository.updateCategory({
            id: input.id,
            organizationId,
            data: {
                name,
                type,
                status: input.status ?? current.status,
            },
        })

        if (!updated) {
            throw new NotFoundError('Categoria financeira nao encontrada')
        }

        return toFinancialCategoryResponseDto(updated)
    }
}

export class DeleteFinancialCategoryUseCase {
    constructor(private readonly repository: FinancialRepository) {}

    async execute(input: {
        id: string
        organizationId: string | null
    }): Promise<void> {
        const organizationId = requireOrganization(input.organizationId)
        const category = await this.repository.findCategoryById({
            id: input.id,
            organizationId,
        })

        if (!category) {
            throw new NotFoundError('Categoria financeira nao encontrada')
        }

        if (
            await this.repository.categoryHasTransactions({
                id: input.id,
                organizationId,
            })
        ) {
            throw new ConflictError(
                'Categoria possui lancamentos e deve ser inativada',
            )
        }

        await this.repository.softDeleteCategory({
            id: input.id,
            organizationId,
        })
    }
}

async function ensureUniqueCategory(
    repository: FinancialRepository,
    input: {
        organizationId: string
        name: string
        type: FinancialTransactionType
    },
) {
    if (await repository.findCategoryByNameAndType(input)) {
        throw new ConflictError('Categoria financeira ja cadastrada')
    }
}

function requireOrganization(organizationId: string | null): string {
    if (!organizationId) {
        throw new ForbiddenError('Organizacao nao selecionada')
    }

    return organizationId
}
