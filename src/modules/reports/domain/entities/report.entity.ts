export type ReportPeriodEntity = {
    year: number
    month: number
    startDate: string
    endDate: string
}

export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export type ReportsFinancialEntity = {
    balances: {
        current: string
        projected: string
    }
    cashFlow: {
        paidIncome: string
        paidExpense: string
        pendingIncome: string
        pendingExpense: string
        result: string
    }
    monthlyFlow: Array<{
        year: number
        month: number
        income: string
        expense: string
        result: string
    }>
    overdue: {
        count: number
        income: string
        expense: string
        items: ReportFinancialItemEntity[]
    }
}

export type ReportFinancialItemEntity = {
    id: string
    description: string
    type: 'INCOME' | 'EXPENSE'
    amount: string
    dueDate: string | null
    status: 'PENDING' | 'PAID' | 'CANCELED'
}

export type ReportsInventoryEntity = {
    activeProducts: number
    activeSkus: number
    totalQuantity: string
    totalValue: string
    zeroStockCount: number
    lowStockCount: number
    lowStockItems: Array<{
        productId: string
        productName: string
        variantId: string
        variantName: string
        sku: string
        currentQuantity: string
        minimumQuantity: string
    }>
}

export type ReportsHrEntity = {
    totalEmployees: number
    byStatus: Array<{ status: string; total: number }>
    admissions: number
    terminations: number
}

export type ReportsLoansEntity = {
    openLoans: number
    overdueLoans: number
    completedLoans: number
    pendingItemsQuantity: string
    occurrences: {
        lost: number
        damaged: number
    }
    pendingCharges: {
        count: number
        amount: string
    }
    overdueItems: Array<{
        id: string
        borrowerType: 'CUSTOMER' | 'EMPLOYEE'
        borrowerName: string | null
        expectedReturnDate: string
        pendingQuantity: string
    }>
}

export type ReportsTasksEntity = {
    openTasks: number
    overdueTasks: number
    urgentTasks: number
    completedTasks: number
    priorityBreakdown: Array<{ priority: string; total: number }>
    attentionItems: Array<{
        id: string
        title: string
        status: string
        priority: string
        dueAt: string | null
    }>
}

export type ReportsAttentionEntity = {
    financialOverdue: {
        count: number
        severity: ReportSeverity
        items: ReportFinancialItemEntity[]
    }
    inventoryLowStock: {
        count: number
        severity: ReportSeverity
        items: ReportsInventoryEntity['lowStockItems']
    }
    loansOverdue: {
        count: number
        severity: ReportSeverity
        items: ReportsLoansEntity['overdueItems']
    }
    tasksUrgentOrOverdue: {
        count: number
        severity: ReportSeverity
        items: ReportsTasksEntity['attentionItems']
    }
}

export type ReportsOverviewEntity = {
    period: ReportPeriodEntity
    financial: ReportsFinancialEntity
    inventory: ReportsInventoryEntity
    hr: ReportsHrEntity
    loans: ReportsLoansEntity
    tasks: ReportsTasksEntity
    attention: ReportsAttentionEntity
}
