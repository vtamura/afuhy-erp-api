import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    BillingProfileEntity,
    FeatureEntity,
    PlanCode,
    PlanEntity,
    StripeEventEntity,
    StripeEventStatus,
    SubscriptionEntity,
    SubscriptionSource,
    SubscriptionStatus,
} from '../../domain/entities/billing.entity'
import type {
    BillingRepository,
    StartStripeEventProcessingInput,
    SetOrganizationSubscriptionInput,
    SyncStripeSubscriptionInput,
    UpsertBillingProfileInput,
} from '../../domain/repositories/billing.repository'
import { env } from '../../../../shared/config/env'

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
    stripe_price_id: string | null
    source: SubscriptionSource
    status: SubscriptionStatus
    starts_at: Date
    ends_at: Date | null
    current_period_start: Date | null
    current_period_end: Date | null
    cancel_at_period_end: boolean
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

type BillingProfileRow = {
    id: string
    organization_id: string
    stripe_customer_id: string
    billing_email: string | null
    metadata: Record<string, unknown> | null
    created_at: Date
    updated_at: Date
}

type StripeEventRow = {
    id: string
    stripe_event_id: string
    type: string
    api_version: string | null
    livemode: boolean
    status: StripeEventStatus
    received_at: Date
    processed_at: Date | null
    error: string | null
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

    findPlanCodeByStripePriceId(stripePriceId: string): PlanCode | null {
        const priceMap: Record<string, PlanCode> = {
            [env.STRIPE_PRICE_STARTER_MONTHLY]: 'STARTER',
            [env.STRIPE_PRICE_PROFESSIONAL_MONTHLY]: 'PROFESSIONAL',
        }

        return priceMap[stripePriceId] ?? null
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

    async findSubscriptionByStripeSubscriptionId(
        stripeSubscriptionId: string,
    ): Promise<SubscriptionEntity | null> {
        const [row] = await this.databaseClient.select<SubscriptionRow>(
            `
                ${this.subscriptionSelectSql()}
                WHERE subscriptions.stripe_subscription_id = :stripeSubscriptionId
                GROUP BY subscriptions.id, plans.id
                LIMIT 1
            `,
            { stripeSubscriptionId },
        )

        return row ? this.toSubscriptionEntity(row) : null
    }

    async findBillingProfileByOrganization(
        organizationId: string,
    ): Promise<BillingProfileEntity | null> {
        const [row] = await this.databaseClient.select<BillingProfileRow>(
            `
                SELECT
                    id,
                    organization_id,
                    stripe_customer_id,
                    billing_email,
                    metadata,
                    created_at,
                    updated_at
                FROM organization_billing_profiles
                WHERE organization_id = :organizationId
                LIMIT 1
            `,
            { organizationId },
        )

        return row ? this.toBillingProfileEntity(row) : null
    }

    async findBillingProfileByStripeCustomerId(
        stripeCustomerId: string,
    ): Promise<BillingProfileEntity | null> {
        const [row] = await this.databaseClient.select<BillingProfileRow>(
            `
                SELECT
                    id,
                    organization_id,
                    stripe_customer_id,
                    billing_email,
                    metadata,
                    created_at,
                    updated_at
                FROM organization_billing_profiles
                WHERE stripe_customer_id = :stripeCustomerId
                LIMIT 1
            `,
            { stripeCustomerId },
        )

        return row ? this.toBillingProfileEntity(row) : null
    }

    async upsertBillingProfile(
        input: UpsertBillingProfileInput,
    ): Promise<BillingProfileEntity> {
        const [row] = await this.databaseClient.query<BillingProfileRow>(
            `
                INSERT INTO organization_billing_profiles (
                    organization_id,
                    stripe_customer_id,
                    billing_email,
                    metadata
                )
                VALUES (
                    :organizationId,
                    :stripeCustomerId,
                    :billingEmail,
                    CAST(:metadata AS JSONB)
                )
                ON CONFLICT (organization_id)
                DO UPDATE SET
                    stripe_customer_id = EXCLUDED.stripe_customer_id,
                    billing_email = COALESCE(
                        EXCLUDED.billing_email,
                        organization_billing_profiles.billing_email
                    ),
                    metadata = organization_billing_profiles.metadata || EXCLUDED.metadata,
                    updated_at = NOW()
                RETURNING
                    id,
                    organization_id,
                    stripe_customer_id,
                    billing_email,
                    metadata,
                    created_at,
                    updated_at
            `,
            {
                organizationId: input.organizationId,
                stripeCustomerId: input.stripeCustomerId,
                billingEmail: input.billingEmail,
                metadata: JSON.stringify(input.metadata ?? {}),
            },
        )

        return this.toBillingProfileEntity(row)
    }

    async findOrganizationBillingDetails(organizationId: string): Promise<{
        organizationName: string
        billingEmail: string | null
    } | null> {
        const [row] = await this.databaseClient.select<{
            organization_name: string
            billing_email: string | null
        }>(
            `
                SELECT
                    organizations.name AS organization_name,
                    users.email AS billing_email
                FROM organizations
                LEFT JOIN organization_users
                    ON organization_users.organization_id = organizations.id
                    AND organization_users.status = 'ACTIVE'
                LEFT JOIN users
                    ON users.id = organization_users.user_id
                    AND users.deleted_at IS NULL
                    AND users.status = 'ACTIVE'
                WHERE organizations.id = :organizationId
                ORDER BY users.created_at ASC NULLS LAST
                LIMIT 1
            `,
            { organizationId },
        )

        if (!row) {
            return null
        }

        return {
            organizationName: row.organization_name,
            billingEmail: row.billing_email,
        }
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
                        AND (
                            source = 'MANUAL'
                            OR :source = 'STRIPE'
                        )
                `,
                {
                    organizationId: input.organizationId,
                    source: input.source ?? 'MANUAL',
                },
            )

            const [row] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO subscriptions (
                        organization_id,
                        plan_id,
                        stripe_customer_id,
                        stripe_subscription_id,
                        stripe_price_id,
                        source,
                        status,
                        starts_at,
                        ends_at,
                        current_period_start,
                        current_period_end,
                        cancel_at_period_end
                    )
                    VALUES (
                        :organizationId,
                        :planId,
                        :stripeCustomerId,
                        :stripeSubscriptionId,
                        :stripePriceId,
                        :source,
                        :status,
                        :startsAt,
                        :endsAt,
                        :currentPeriodStart,
                        :currentPeriodEnd,
                        :cancelAtPeriodEnd
                    )
                    RETURNING id
                `,
                {
                    organizationId: input.organizationId,
                    planId: plan.id,
                    stripeCustomerId: input.stripeCustomerId ?? null,
                    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
                    stripePriceId: input.stripePriceId ?? null,
                    source: input.source ?? 'MANUAL',
                    status: input.status,
                    startsAt: input.startsAt,
                    endsAt: input.endsAt,
                    currentPeriodStart: input.currentPeriodStart ?? null,
                    currentPeriodEnd: input.currentPeriodEnd ?? null,
                    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
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

    async syncStripeSubscription(
        input: SyncStripeSubscriptionInput,
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
                        AND (
                            stripe_subscription_id IS NULL
                            OR stripe_subscription_id <> :stripeSubscriptionId
                        )
                `,
                {
                    organizationId: input.organizationId,
                    stripeSubscriptionId: input.stripeSubscriptionId,
                },
            )

            const [row] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO subscriptions (
                        organization_id,
                        plan_id,
                        stripe_customer_id,
                        stripe_subscription_id,
                        stripe_price_id,
                        source,
                        status,
                        starts_at,
                        ends_at,
                        current_period_start,
                        current_period_end,
                        cancel_at_period_end
                    )
                    VALUES (
                        :organizationId,
                        :planId,
                        :stripeCustomerId,
                        :stripeSubscriptionId,
                        :stripePriceId,
                        'STRIPE',
                        :status,
                        :startsAt,
                        :endsAt,
                        :currentPeriodStart,
                        :currentPeriodEnd,
                        :cancelAtPeriodEnd
                    )
                    ON CONFLICT (stripe_subscription_id)
                    DO UPDATE SET
                        organization_id = EXCLUDED.organization_id,
                        plan_id = EXCLUDED.plan_id,
                        stripe_customer_id = EXCLUDED.stripe_customer_id,
                        stripe_price_id = EXCLUDED.stripe_price_id,
                        source = 'STRIPE',
                        status = EXCLUDED.status,
                        starts_at = EXCLUDED.starts_at,
                        ends_at = EXCLUDED.ends_at,
                        current_period_start = EXCLUDED.current_period_start,
                        current_period_end = EXCLUDED.current_period_end,
                        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
                        updated_at = NOW()
                    RETURNING id
                `,
                {
                    organizationId: input.organizationId,
                    planId: plan.id,
                    stripeCustomerId: input.stripeCustomerId,
                    stripeSubscriptionId: input.stripeSubscriptionId,
                    stripePriceId: input.stripePriceId,
                    status: input.status,
                    startsAt: input.startsAt,
                    endsAt: input.endsAt,
                    currentPeriodStart: input.currentPeriodStart,
                    currentPeriodEnd: input.currentPeriodEnd,
                    cancelAtPeriodEnd: input.cancelAtPeriodEnd,
                },
            )

            const subscription = await this.findSubscriptionById(
                row.id,
                databaseClient,
            )

            if (!subscription) {
                throw new Error('Subscription could not be synced')
            }

            return subscription
        })
    }

    async startStripeEventProcessing(
        input: StartStripeEventProcessingInput,
    ): Promise<{ event: StripeEventEntity; inserted: boolean }> {
        const [row] = await this.databaseClient.query<
            StripeEventRow & { inserted: boolean }
        >(
            `
                WITH inserted AS (
                    INSERT INTO stripe_events (
                        stripe_event_id,
                        type,
                        api_version,
                        livemode,
                        payload,
                        status
                    )
                    VALUES (
                        :stripeEventId,
                        :type,
                        :apiVersion,
                        :livemode,
                        CAST(:payload AS JSONB),
                        'PROCESSING'
                    )
                    ON CONFLICT (stripe_event_id) DO NOTHING
                    RETURNING
                        id,
                        stripe_event_id,
                        type,
                        api_version,
                        livemode,
                        status,
                        received_at,
                        processed_at,
                        error,
                        TRUE AS inserted
                )
                SELECT * FROM inserted
                UNION ALL
                SELECT
                    id,
                    stripe_event_id,
                    type,
                    api_version,
                    livemode,
                    status,
                    received_at,
                    processed_at,
                    error,
                    FALSE AS inserted
                FROM stripe_events
                WHERE stripe_event_id = :stripeEventId
                    AND NOT EXISTS (SELECT 1 FROM inserted)
                LIMIT 1
            `,
            {
                stripeEventId: input.stripeEventId,
                type: input.type,
                apiVersion: input.apiVersion,
                livemode: input.livemode,
                payload: JSON.stringify(input.payload),
            },
        )

        return {
            event: this.toStripeEventEntity(row),
            inserted: row.inserted,
        }
    }

    async markStripeEventProcessed(stripeEventId: string): Promise<void> {
        await this.databaseClient.update(
            `
                UPDATE stripe_events
                SET status = 'PROCESSED',
                    processed_at = NOW(),
                    error = NULL
                WHERE stripe_event_id = :stripeEventId
            `,
            { stripeEventId },
        )
    }

    async markStripeEventFailed(
        stripeEventId: string,
        error: string,
    ): Promise<void> {
        await this.databaseClient.update(
            `
                UPDATE stripe_events
                SET status = 'FAILED',
                    error = :error,
                    processed_at = NOW()
                WHERE stripe_event_id = :stripeEventId
            `,
            { stripeEventId, error },
        )
    }

    async withTransaction<T>(
        callback: (billingRepository: BillingRepository) => Promise<T>,
    ): Promise<T> {
        return this.databaseClient.transaction((databaseClient) =>
            callback(new PostgresBillingRepository(databaseClient)),
        )
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
                subscriptions.stripe_price_id,
                subscriptions.source,
                subscriptions.status,
                subscriptions.starts_at,
                subscriptions.ends_at,
                subscriptions.current_period_start,
                subscriptions.current_period_end,
                subscriptions.cancel_at_period_end,
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
            stripePriceId: row.stripe_price_id,
            source: row.source,
            status: row.status,
            startsAt: new Date(row.starts_at),
            endsAt: row.ends_at ? new Date(row.ends_at) : null,
            currentPeriodStart: row.current_period_start
                ? new Date(row.current_period_start)
                : null,
            currentPeriodEnd: row.current_period_end
                ? new Date(row.current_period_end)
                : null,
            cancelAtPeriodEnd: row.cancel_at_period_end,
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

    private toBillingProfileEntity(
        row: BillingProfileRow,
    ): BillingProfileEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            stripeCustomerId: row.stripe_customer_id,
            billingEmail: row.billing_email,
            metadata: row.metadata ?? {},
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        }
    }

    private toStripeEventEntity(row: StripeEventRow): StripeEventEntity {
        return {
            id: row.id,
            stripeEventId: row.stripe_event_id,
            type: row.type,
            apiVersion: row.api_version,
            livemode: row.livemode,
            status: row.status,
            receivedAt: new Date(row.received_at),
            processedAt: row.processed_at ? new Date(row.processed_at) : null,
            error: row.error,
        }
    }
}
