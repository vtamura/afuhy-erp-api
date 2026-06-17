import type {
    FeatureEntity,
    PlanEntity,
    SubscriptionEntity,
} from '../../domain/entities/billing.entity'
import type {
    FeatureResponseDto,
    PlanResponseDto,
    SubscriptionResponseDto,
} from '../dto'

export function toFeatureResponseDto(
    feature: FeatureEntity,
): FeatureResponseDto {
    return {
        id: feature.id,
        code: feature.code,
        description: feature.description,
    }
}

export function toPlanResponseDto(plan: PlanEntity): PlanResponseDto {
    return {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        priceCents: plan.priceCents,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        maxUsers: plan.maxUsers,
        createdAt: plan.createdAt.toISOString(),
        features: plan.features.map(toFeatureResponseDto),
    }
}

export function toSubscriptionResponseDto(
    subscription: SubscriptionEntity,
): SubscriptionResponseDto {
    return {
        id: subscription.id,
        organizationId: subscription.organizationId,
        plan: toPlanResponseDto(subscription.plan),
        status: subscription.status,
        startsAt: subscription.startsAt.toISOString(),
        endsAt: subscription.endsAt?.toISOString() ?? null,
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString(),
    }
}
