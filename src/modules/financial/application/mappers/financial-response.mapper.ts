import type {
    FinancialAccountEntity,
    FinancialCategoryEntity,
    FinancialTransactionEntity,
} from '../../domain/entities/financial.entity'
import type {
    FinancialAccountResponseDto,
    FinancialCategoryResponseDto,
    FinancialTransactionResponseDto,
} from '../dto'
import type { FinancialObligationEntity } from '../../domain/repositories/financial-obligation.repository'
import type { FinancialObligationResponseDto } from '../dto'

export function toFinancialAccountResponseDto(
    entity: FinancialAccountEntity,
): FinancialAccountResponseDto {
    return {
        ...entity,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
        deletedAt: entity.deletedAt?.toISOString() ?? null,
    }
}

export function toFinancialCategoryResponseDto(
    entity: FinancialCategoryEntity,
): FinancialCategoryResponseDto {
    return {
        ...entity,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
        deletedAt: entity.deletedAt?.toISOString() ?? null,
    }
}

export function toFinancialTransactionResponseDto(
    entity: FinancialTransactionEntity,
): FinancialTransactionResponseDto {
    return {
        ...entity,
        paidAt: entity.paidAt?.toISOString() ?? null,
        canceledAt: entity.canceledAt?.toISOString() ?? null,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
        deletedAt: entity.deletedAt?.toISOString() ?? null,
    }
}

export function toFinancialObligationResponseDto(
    entity: FinancialObligationEntity,
    today: string,
): FinancialObligationResponseDto {
    return {
        ...toFinancialTransactionResponseDto(entity),
        account: entity.account,
        category: entity.category,
        counterparty: entity.counterparty,
        isOverdue:
            entity.status === 'PENDING' &&
            entity.dueDate !== null &&
            entity.dueDate < today,
    }
}
