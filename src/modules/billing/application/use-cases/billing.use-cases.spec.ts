import { ForbiddenError, NotFoundError } from '../../../../shared/domain/errors'
import type {
    PlanEntity,
    SubscriptionEntity,
} from '../../domain/entities/billing.entity'
import type { BillingRepository } from '../../domain/repositories/billing.repository'
import { GetCurrentSubscriptionUseCase } from './get-current-subscription.use-case'
import { ListPlansUseCase } from './list-plans.use-case'
import { SetOrganizationSubscriptionUseCase } from './set-organization-subscription.use-case'

describe('Billing use cases', () => {
    const now = new Date('2026-01-01T00:00:00.000Z')
    const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'

    function makePlan(): PlanEntity {
        return {
            id: 'ccbc994b-fd5f-496e-a66a-a9829efa91c4',
            code: 'STARTER',
            name: 'Starter',
            priceCents: 9990,
            currency: 'BRL',
            billingInterval: 'MONTH',
            maxUsers: 5,
            createdAt: now,
            features: [
                {
                    id: '64ba4cdb-cb2c-4487-8dac-6fd0e4348311',
                    code: 'financial.basic',
                    description: 'Financeiro basico',
                },
            ],
        }
    }

    function makeSubscription(): SubscriptionEntity {
        return {
            id: '953acb97-b9e2-48bb-bce7-24a64f359274',
            organizationId,
            plan: makePlan(),
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            status: 'ACTIVE',
            startsAt: now,
            endsAt: null,
            createdAt: now,
            updatedAt: now,
        }
    }

    function makeRepository(): BillingRepository {
        return {
            listPlans: jest.fn().mockResolvedValue([makePlan()]),
            findPlanByCode: jest.fn().mockResolvedValue(makePlan()),
            findCurrentSubscriptionByOrganization: jest
                .fn()
                .mockResolvedValue(makeSubscription()),
            setCurrentSubscription: jest
                .fn()
                .mockResolvedValue(makeSubscription()),
            organizationHasFeature: jest.fn(),
            countUsedSeats: jest.fn(),
        }
    }

    it('lists plans with features', async () => {
        const repository = makeRepository()
        const useCase = new ListPlansUseCase(repository)

        const result = await useCase.execute()

        expect(result).toEqual([
            expect.objectContaining({
                code: 'STARTER',
                maxUsers: 5,
                features: [
                    expect.objectContaining({ code: 'financial.basic' }),
                ],
            }),
        ])
    })

    it('gets the current subscription', async () => {
        const repository = makeRepository()
        const useCase = new GetCurrentSubscriptionUseCase(repository)

        const result = await useCase.execute({ organizationId })

        expect(
            repository.findCurrentSubscriptionByOrganization,
        ).toHaveBeenCalledWith(organizationId)
        expect(result).toMatchObject({
            organizationId,
            status: 'ACTIVE',
            plan: { code: 'STARTER' },
        })
    })

    it('throws when getting subscription without selected organization', async () => {
        const useCase = new GetCurrentSubscriptionUseCase(makeRepository())

        await expect(
            useCase.execute({ organizationId: null }),
        ).rejects.toBeInstanceOf(ForbiddenError)
    })

    it('throws when current subscription does not exist', async () => {
        const repository = makeRepository()
        jest.spyOn(
            repository,
            'findCurrentSubscriptionByOrganization',
        ).mockResolvedValue(null)
        const useCase = new GetCurrentSubscriptionUseCase(repository)

        await expect(
            useCase.execute({ organizationId }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('sets a current subscription', async () => {
        const repository = makeRepository()
        const useCase = new SetOrganizationSubscriptionUseCase(repository)

        const result = await useCase.execute({
            organizationId,
            planCode: 'STARTER',
            status: 'ACTIVE',
            startsAt: now.toISOString(),
            endsAt: null,
        })

        expect(repository.setCurrentSubscription).toHaveBeenCalledWith({
            organizationId,
            planCode: 'STARTER',
            status: 'ACTIVE',
            startsAt: now,
            endsAt: null,
        })
        expect(result.plan.code).toBe('STARTER')
    })
})
