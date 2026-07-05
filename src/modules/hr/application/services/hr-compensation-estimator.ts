import type { PayFrequency } from '../../domain/entities/hr.entity'

export type EstimatedWorkloadUnit =
    | 'FIXED_MONTHLY'
    | 'WEEKS_PER_MONTH'
    | 'FORTNIGHTS_PER_MONTH'
    | 'DAYS_PER_MONTH'
    | 'DAYS_PER_WEEK'
    | 'HOURS_PER_MONTH'
    | 'HOURS_PER_WEEK'

export type EstimatedWorkload = {
    unit: EstimatedWorkloadUnit
    amount?: number
}

export type CompensationEstimateInput = {
    payFrequency: PayFrequency
    payAmount: string
    estimatedWorkload?: EstimatedWorkload
    estimatedMonthlyUnits?: string
}

export type CompensationEstimate = {
    payAmount: string
    payFrequency: PayFrequency
    estimatedWorkload: EstimatedWorkload | null
    estimatedMonthlyUnits: string
    estimatedMonthlyAmount: string
    formula: string
    explanation: string
    hints: string[]
}

export class HrCompensationEstimationError extends Error {
    constructor(
        message: string,
        readonly path: Array<string | number> = ['estimatedWorkload'],
    ) {
        super(message)
        this.name = 'HrCompensationEstimationError'
    }
}

const AVERAGE_WEEKS_PER_MONTH = 4.3333

export function estimateHrCompensation(
    input: CompensationEstimateInput,
): CompensationEstimate {
    const units = resolveEstimatedMonthlyUnits(input)
    const payAmount = Number(input.payAmount)
    const estimatedMonthlyAmount = (payAmount * Number(units)).toFixed(2)

    return {
        payAmount: input.payAmount,
        payFrequency: input.payFrequency,
        estimatedWorkload: input.estimatedWorkload ?? null,
        estimatedMonthlyUnits: units,
        estimatedMonthlyAmount,
        formula: buildFormula(input, units),
        explanation: buildExplanation(input, units),
        hints: [
            'Este valor e uma estimativa para provisao financeira, nao uma folha real.',
            'Voce pode ajustar a carga estimada se a rotina mensal variar.',
        ],
    }
}

function resolveEstimatedMonthlyUnits(input: CompensationEstimateInput) {
    if (input.estimatedWorkload)
        return resolveUnitsFromWorkload(
            input.payFrequency,
            input.estimatedWorkload,
        )

    if (input.estimatedMonthlyUnits) return input.estimatedMonthlyUnits

    if (input.payFrequency === 'MONTHLY') return '1.0000'
    if (input.payFrequency === 'WEEKLY')
        return AVERAGE_WEEKS_PER_MONTH.toFixed(4)
    if (input.payFrequency === 'BIWEEKLY') return '2.0000'

    throw new HrCompensationEstimationError(
        input.payFrequency === 'DAILY'
            ? 'Informe a carga estimada em dias por mes ou dias por semana para calcular a estimativa mensal.'
            : 'Informe a carga estimada em horas por mes ou horas por semana para calcular a estimativa mensal.',
    )
}

function resolveUnitsFromWorkload(
    payFrequency: PayFrequency,
    workload: EstimatedWorkload,
) {
    if (payFrequency === 'MONTHLY') {
        ensureUnit(payFrequency, workload.unit, ['FIXED_MONTHLY'])
        return '1.0000'
    }
    if (payFrequency === 'WEEKLY') {
        ensureUnit(payFrequency, workload.unit, ['WEEKS_PER_MONTH'])
        return (workload.amount ?? AVERAGE_WEEKS_PER_MONTH).toFixed(4)
    }
    if (payFrequency === 'BIWEEKLY') {
        ensureUnit(payFrequency, workload.unit, ['FORTNIGHTS_PER_MONTH'])
        return (workload.amount ?? 2).toFixed(4)
    }
    if (payFrequency === 'DAILY') {
        ensureUnit(payFrequency, workload.unit, [
            'DAYS_PER_MONTH',
            'DAYS_PER_WEEK',
        ])
        const amount = requireWorkloadAmount(workload)
        return (
            workload.unit === 'DAYS_PER_WEEK'
                ? amount * AVERAGE_WEEKS_PER_MONTH
                : amount
        ).toFixed(4)
    }
    ensureUnit(payFrequency, workload.unit, [
        'HOURS_PER_MONTH',
        'HOURS_PER_WEEK',
    ])
    const amount = requireWorkloadAmount(workload)
    return (
        workload.unit === 'HOURS_PER_WEEK'
            ? amount * AVERAGE_WEEKS_PER_MONTH
            : amount
    ).toFixed(4)
}

function ensureUnit(
    payFrequency: PayFrequency,
    unit: EstimatedWorkloadUnit,
    allowed: EstimatedWorkloadUnit[],
) {
    if (allowed.includes(unit)) return
    throw new HrCompensationEstimationError(
        `Carga estimada ${unit} nao e compativel com pagamento ${payFrequency}.`,
        ['estimatedWorkload', 'unit'],
    )
}

function requireWorkloadAmount(workload: EstimatedWorkload) {
    if (workload.amount && workload.amount > 0) return workload.amount
    throw new HrCompensationEstimationError(
        'Informe a quantidade da carga estimada para calcular a estimativa mensal.',
        ['estimatedWorkload', 'amount'],
    )
}

function buildFormula(input: CompensationEstimateInput, units: string) {
    const amount = input.estimatedWorkload?.amount
    if (
        input.estimatedWorkload?.unit === 'DAYS_PER_WEEK' ||
        input.estimatedWorkload?.unit === 'HOURS_PER_WEEK'
    )
        return `${input.payAmount} x (${amount} x ${AVERAGE_WEEKS_PER_MONTH.toFixed(4)})`
    return `${input.payAmount} x ${units}`
}

function buildExplanation(input: CompensationEstimateInput, units: string) {
    const amount = input.estimatedWorkload?.amount
    if (input.payFrequency === 'MONTHLY')
        return 'Remuneracao mensal usa uma unidade mensal fixa.'
    if (input.payFrequency === 'WEEKLY')
        return 'Usamos a media de 4,3333 semanas por mes para estimar a remuneracao mensal.'
    if (input.payFrequency === 'BIWEEKLY')
        return 'Consideramos duas quinzenas por mes para estimar a remuneracao mensal.'
    if (input.estimatedWorkload?.unit === 'DAYS_PER_WEEK')
        return `Estimamos ${amount} dias por semana multiplicados pela media de 4,3333 semanas por mes.`
    if (input.estimatedWorkload?.unit === 'HOURS_PER_WEEK')
        return `Estimamos ${amount} horas por semana multiplicadas pela media de 4,3333 semanas por mes.`
    if (input.estimatedWorkload?.unit === 'DAYS_PER_MONTH')
        return `Estimamos ${amount} dias por mes para a provisao mensal.`
    if (input.estimatedWorkload?.unit === 'HOURS_PER_MONTH')
        return `Estimamos ${amount} horas por mes para a provisao mensal.`
    return `Usamos ${units} unidades mensais estimadas para calcular a provisao.`
}
