import { ForbiddenError } from '../../../../../shared/domain/errors'
import type { BillingRepository } from '../../../domain/repositories/billing.repository'
import { createAuthorizeFeatureMiddleware } from './authorize-feature.middleware'
import { createEnforceUserLimitMiddleware } from './enforce-user-limit.middleware'

describe('Billing middlewares', () => {
    const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'

    function makeRepository(): BillingRepository {
        return {
            listPlans: jest.fn(),
            findPlanByCode: jest.fn(),
            findCurrentSubscriptionByOrganization: jest.fn().mockResolvedValue({
                id: '953acb97-b9e2-48bb-bce7-24a64f359274',
                organizationId,
                status: 'ACTIVE',
                seatLimit: 5,
            }),
            setCurrentSubscription: jest.fn(),
            organizationHasFeature: jest.fn().mockResolvedValue(true),
            countUsedSeats: jest.fn().mockResolvedValue(4),
        } as unknown as BillingRepository
    }

    it('allows a feature available in the current plan', async () => {
        const repository = makeRepository()
        const middleware =
            createAuthorizeFeatureMiddleware(repository)('financial.basic')
        const next = jest.fn()

        await middleware(
            { authUser: { organizationId } } as never,
            {} as never,
            next,
        )

        expect(repository.organizationHasFeature).toHaveBeenCalledWith({
            organizationId,
            featureCode: 'financial.basic',
        })
        expect(next).toHaveBeenCalledWith()
    })

    it('blocks a feature unavailable in the current plan', async () => {
        const repository = makeRepository()
        jest.spyOn(repository, 'organizationHasFeature').mockResolvedValue(
            false,
        )
        const middleware =
            createAuthorizeFeatureMiddleware(repository)('api.access')
        const next = jest.fn()

        await middleware(
            { authUser: { organizationId } } as never,
            {} as never,
            next,
        )

        expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError)
    })

    it('allows adding a seat below plan limit', async () => {
        const repository = makeRepository()
        const middleware = createEnforceUserLimitMiddleware(repository)()
        const next = jest.fn()

        await middleware(
            {
                params: { id: organizationId },
                authUser: { organizationId },
            } as never,
            {} as never,
            next,
        )

        expect(repository.countUsedSeats).toHaveBeenCalledWith(organizationId)
        expect(next).toHaveBeenCalledWith()
    })

    it('blocks adding a seat at plan limit', async () => {
        const repository = makeRepository()
        jest.spyOn(repository, 'countUsedSeats').mockResolvedValue(5)
        const middleware = createEnforceUserLimitMiddleware(repository)()
        const next = jest.fn()

        await middleware(
            {
                params: { id: organizationId },
                authUser: { organizationId },
            } as never,
            {} as never,
            next,
        )

        expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError)
    })

    it('allows adding a seat when extra licenses increase the limit', async () => {
        const repository = makeRepository()
        jest.spyOn(
            repository,
            'findCurrentSubscriptionByOrganization',
        ).mockResolvedValue({
            id: '953acb97-b9e2-48bb-bce7-24a64f359274',
            organizationId,
            status: 'ACTIVE',
            seatLimit: 7,
        } as never)
        jest.spyOn(repository, 'countUsedSeats').mockResolvedValue(6)
        const middleware = createEnforceUserLimitMiddleware(repository)()
        const next = jest.fn()

        await middleware(
            {
                params: { id: organizationId },
                authUser: { organizationId },
            } as never,
            {} as never,
            next,
        )

        expect(next).toHaveBeenCalledWith()
    })
})
