import {
    estimateHrCompensation,
    HrCompensationEstimationError,
} from './hr-compensation-estimator'

describe('estimateHrCompensation', () => {
    it('uses automatic defaults for monthly, weekly and biweekly payments', () => {
        expect(
            estimateHrCompensation({
                payAmount: '5000.00',
                payFrequency: 'MONTHLY',
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '1.0000',
            estimatedMonthlyAmount: '5000.00',
        })
        expect(
            estimateHrCompensation({
                payAmount: '800.00',
                payFrequency: 'WEEKLY',
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '4.3333',
            estimatedMonthlyAmount: '3466.64',
        })
        expect(
            estimateHrCompensation({
                payAmount: '1500.00',
                payFrequency: 'BIWEEKLY',
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '2.0000',
            estimatedMonthlyAmount: '3000.00',
        })
    })

    it('calculates daily workload by month and by week', () => {
        expect(
            estimateHrCompensation({
                payAmount: '200.00',
                payFrequency: 'DAILY',
                estimatedWorkload: {
                    unit: 'DAYS_PER_MONTH',
                    amount: 22,
                },
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '22.0000',
            estimatedMonthlyAmount: '4400.00',
            formula: '200.00 x 22.0000',
        })
        expect(
            estimateHrCompensation({
                payAmount: '200.00',
                payFrequency: 'DAILY',
                estimatedWorkload: {
                    unit: 'DAYS_PER_WEEK',
                    amount: 5,
                },
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '21.6665',
            estimatedMonthlyAmount: '4333.30',
            formula: '200.00 x (5 x 4.3333)',
        })
    })

    it('calculates hourly workload by month and by week', () => {
        expect(
            estimateHrCompensation({
                payAmount: '50.00',
                payFrequency: 'HOURLY',
                estimatedWorkload: {
                    unit: 'HOURS_PER_MONTH',
                    amount: 160,
                },
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '160.0000',
            estimatedMonthlyAmount: '8000.00',
        })
        expect(
            estimateHrCompensation({
                payAmount: '50.00',
                payFrequency: 'HOURLY',
                estimatedWorkload: {
                    unit: 'HOURS_PER_WEEK',
                    amount: 40,
                },
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '173.3320',
            estimatedMonthlyAmount: '8666.60',
            formula: '50.00 x (40 x 4.3333)',
        })
    })

    it('requires workload or technical units for daily and hourly payments', () => {
        expect(() =>
            estimateHrCompensation({
                payAmount: '200.00',
                payFrequency: 'DAILY',
            }),
        ).toThrow(HrCompensationEstimationError)
    })

    it('rejects incompatible workload units', () => {
        expect(() =>
            estimateHrCompensation({
                payAmount: '50.00',
                payFrequency: 'HOURLY',
                estimatedWorkload: {
                    unit: 'DAYS_PER_MONTH',
                    amount: 22,
                },
            }),
        ).toThrow('Carga estimada DAYS_PER_MONTH nao e compativel')
    })

    it('prefers workload over technical estimated units', () => {
        expect(
            estimateHrCompensation({
                payAmount: '50.00',
                payFrequency: 'HOURLY',
                estimatedMonthlyUnits: '160.0000',
                estimatedWorkload: {
                    unit: 'HOURS_PER_WEEK',
                    amount: 40,
                },
            }),
        ).toMatchObject({
            estimatedMonthlyUnits: '173.3320',
        })
    })
})
