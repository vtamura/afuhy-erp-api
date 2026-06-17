import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    FeatureEntity,
    PlanCode,
    PlanEntity,
    SubscriptionEntity,
    SubscriptionStatus,
} from '../../domain/entities/billing.entity'
import type {
    BillingRepository,
    SetOrganizationSubscriptionInput,
} from '../../domain/repositories/billing.repository'

type PlanRow = {
    id: string
    code: PlanCode
    name: string
    price_cents: number
    currency: string
    billing_interval: string
    max_users: number
    created_at: Date
    features: FeatureEntity[] | null
}

type SubscriptionRow = {
    id: string
    organization_id: string
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    status: SubscriptionStatus
    starts_at: Date
    ends_at: Date | null
    created_at: Date
    updated_at: Date
    plan_id: string
    plan_code: PlanCode
    plan_name: string
    plan_price_cents: number
    plan_currency: string
    plan_billing_interval: string
    plan_max_users: number
    plan_created_at: Date
    features: FeatureEntity[] | null
}

export class PostgresBillingRepository implements BillingRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async listPlans(): Promise<PlanEntity[]> {
        const rows = await this.databaseClient.select<PlanRow>(
            `
                SELECT
                    plans.id,
                    plans.code,
                    plans.name,
                    plans.price_cents,
                    plans.currency,
                    plans.billing_interval,
                    plans.max_users,
                    plans.created_at,
                    COALESCE(
                        JSONB_AGG(
                            JSONB_BUILD_OBJECT(
                                'id', features.id,
                                'code', features.code,
                                'description', features.description
                            )
                            ORDER BY features.code
                        ) FILTER (WHERE features.id IS NOT NULL),
                        '[]'::jsonb
                    ) AS features
                FROM plans
                LEFT JOIN plan_features
                    ON plan_features.plan_id = plans.id
                LEFT JOIN features
                    ON features.id = plan_features.feature_id
                GROUP BY plans.id
                ORDER BY plans.price_cents ASC
            `,
        )

        return rows.map((row) => this.toPlanEntity(row))
    }

    async findPlanByCode(planCode: PlanCode): Promise<PlanEntity | null> {
        const [plan] = await this.listPlansByWhere(
            'WHERE plans.code = :planCode',
            { planCode },
        )

        return plan ?? null
    }

    async findCurrentSubscriptionByOrganization(
        organizationId: string,
    ): Promise<SubscriptionEntity | null> {
        const [row] = await this.databaseClient.select<SubscriptionRow>(
            `
                ${this.subscriptionSelectSql()}
                WHERE subscriptions.organization_id = :organizationId
                    AND subscriptions.status IN ('TRIALING', 'ACTIVE', 'PAST_DUE')
                GROUP BY subscriptions.id, plans.id
                ORDER BY subscriptions.created_at DESC
                LIMIT 1
            `,
            { organizationId },
        )

        return row ? this.toSubscriptionEntity(row) : null
    }

    async setCurrentSubscription(
        input: SetOrganizationSubscriptionInput,
    ): Promise<SubscriptionEntity> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const [plan] = await this.listPlansByWhere(
                'WHERE plans.code = :planCode',
                { planCode: input.planCode },
                databaseClient,
            )

            if (!plan) {
                throw new Error('Plan not found')
            }

            await databaseClient.query(
                `
                    UPDATE subscriptions
                    SET status = 'CANCELED',
                        ends_at = COALESCE(ends_at, NOW()),
                        updated_at = NOW()
                    WHERE organization_id = :organizationId
                        AND status IN ('TRIALING', 'ACTIVE', 'PAST_DUE')
                `,
                { organizationId: input.organizationId },
            )

            const [row] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO subscriptions (
                        organization_id,
                        plan_id,
                        status,
                        starts_at,
                        ends_at
                    )
                    VALUES (
                        :organizationId,
                        :planId,
                        :status,
                        :startsAt,
                        :endsAt
                    )
                    RETURNING id
                `,
                {
                    organizationId: input.organizationId,
                    planId: plan.id,
                    status: input.status,
                    startsAt: input.startsAt,
                    endsAt: input.endsAt,
                },
            )

            const subscription = await this.findSubscriptionById(
                row.id,
                databaseClient,
            )

            if (!subscription) {
                throw new Error('Subscription could not be created')
            }

            return subscription
        })
    }

    async organizationHasFeature(input: {
        organizationId: string
        featureCode: string
    }): Promise<boolean> {
        const [row] = await this.databaseClient.select<{ id: string }>(
            `
                SELECT features.id
                FROM subscriptions
                INNER JOIN plans
                    ON plans.id = subscriptions.plan_id
                INNER JOIN plan_features
                    ON plan_features.plan_id = plans.id
                INNER JOIN features
                    ON features.id = plan_features.feature_id
                WHERE subscriptions.organization_id = :organizationId
                    AND subscriptions.status IN ('TRIALING', 'ACTIVE')
                    AND features.code = :featureCode
                LIMIT 1
            `,
            input,
        )

        return Boolean(row)
    }

    async countUsedSeats(organizationId: string): Promise<number> {
        const [row] = await this.databaseClient.select<{ total: string }>(
            `
                WITH active_members AS (
                    SELECT users.email
                    FROM organization_users
                    INNER JOIN users
                        ON users.id = organization_users.user_id
                        AND users.deleted_at IS NULL
                    WHERE organization_users.organization_id = :organizationId
                        AND organization_users.status = 'ACTIVE'
                ),
                pending_invitations AS (
                    SELECT organization_invitations.email
                    FROM organization_invitations
                    WHERE organization_invitations.organization_id = :organizationId
                        AND organization_invitations.status = 'PENDING'
                        AND organization_invitations.expires_at > NOW()
                )
                SELECT COUNT(DISTINCT email)::text AS total
                FROM (
                    SELECT email FROM active_members
                    UNION ALL
                    SELECT email FROM pending_invitations
                ) seats
            `,
            { organizationId },
        )

        return Number(row?.total ?? 0)
    }

    private async findSubscriptionById(
        subscriptionId: string,
        databaseClient: DatabaseClient,
    ): Promise<SubscriptionEntity | null> {
        const [row] = await databaseClient.select<SubscriptionRow>(
            `
                ${this.subscriptionSelectSql()}
                WHERE subscriptions.id = :subscriptionId
                GROUP BY subscriptions.id, plans.id
                LIMIT 1
            `,
            { subscriptionId },
        )

        return row ? this.toSubscriptionEntity(row) : null
    }

    private async listPlansByWhere(
        whereClause: string,
        replacements: Record<string, unknown>,
        databaseClient: DatabaseClient = this.databaseClient,
    ): Promise<PlanEntity[]> {
        const rows = await databaseClient.select<PlanRow>(
            `
                SELECT
                    plans.id,
                    plans.code,
                    plans.name,
                    plans.price_cents,
                    plans.currency,
                    plans.billing_interval,
                    plans.max_users,
                    plans.created_at,
                    COALESCE(
                        JSONB_AGG(
                            JSONB_BUILD_OBJECT(
                                'id', features.id,
                                'code', features.code,
                                'description', features.description
                            )
                            ORDER BY features.code
                        ) FILTER (WHERE features.id IS NOT NULL),
                        '[]'::jsonb
                    ) AS features
                FROM plans
                LEFT JOIN plan_features
                    ON plan_features.plan_id = plans.id
                LEFT JOIN features
                    ON features.id = plan_features.feature_id
                ${whereClause}
                GROUP BY plans.id
                ORDER BY plans.price_cents ASC
            `,
            replacements,
        )

        return rows.map((row) => this.toPlanEntity(row))
    }

    private subscriptionSelectSql(): string {
        return `
            SELECT
                subscriptions.id,
                subscriptions.organization_id,
                subscriptions.stripe_customer_id,
                subscriptions.stripe_subscription_id,
                subscriptions.status,
                subscriptions.starts_at,
                subscriptions.ends_at,
                subscriptions.created_at,
                subscriptions.updated_at,
                plans.id AS plan_id,
                plans.code AS plan_code,
                plans.name AS plan_name,
                plans.price_cents AS plan_price_cents,
                plans.currency AS plan_currency,
                plans.billing_interval AS plan_billing_interval,
                plans.max_users AS plan_max_users,
                plans.created_at AS plan_created_at,
                COALESCE(
                    JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                            'id', features.id,
                            'code', features.code,
                            'description', features.description
                        )
                        ORDER BY features.code
                    ) FILTER (WHERE features.id IS NOT NULL),
                    '[]'::jsonb
                ) AS features
            FROM subscriptions
            INNER JOIN plans
                ON plans.id = subscriptions.plan_id
            LEFT JOIN plan_features
                ON plan_features.plan_id = plans.id
            LEFT JOIN features
                ON features.id = plan_features.feature_id
        `
    }

    private toPlanEntity(row: PlanRow): PlanEntity {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            priceCents: Number(row.price_cents),
            currency: row.currency,
            billingInterval: row.billing_interval,
            maxUsers: Number(row.max_users),
            createdAt: new Date(row.created_at),
            features: row.features ?? [],
        }
    }

    private toSubscriptionEntity(row: SubscriptionRow): SubscriptionEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            stripeCustomerId: row.stripe_customer_id,
            stripeSubscriptionId: row.stripe_subscription_id,
            status: row.status,
            startsAt: new Date(row.starts_at),
            endsAt: row.ends_at ? new Date(row.ends_at) : null,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            plan: {
                id: row.plan_id,
                code: row.plan_code,
                name: row.plan_name,
                priceCents: Number(row.plan_price_cents),
                currency: row.plan_currency,
                billingInterval: row.plan_billing_interval,
                maxUsers: Number(row.plan_max_users),
                createdAt: new Date(row.plan_created_at),
                features: row.features ?? [],
            },
        }
    }
}
