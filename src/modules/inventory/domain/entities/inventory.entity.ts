export type InventoryUnit = 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'CX'
export type InventoryStatus = 'ACTIVE' | 'INACTIVE'
export type InventoryMovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT'

export type InventoryVariantEntity = {
    id: string
    organizationId: string
    productId: string
    name: string
    sku: string
    barcode: string | null
    salePrice: string
    averageCost: string
    currentQuantity: string
    minimumQuantity: string
    status: InventoryStatus
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export type InventoryProductEntity = {
    id: string
    organizationId: string
    name: string
    description: string | null
    unit: InventoryUnit
    status: InventoryStatus
    variants: InventoryVariantEntity[]
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
}

export type InventoryMovementEntity = {
    id: string
    organizationId: string
    productId: string
    productName: string
    variantId: string
    variantName: string
    variantSku: string
    type: InventoryMovementType
    quantity: string
    unitCost: string
    totalCost: string
    supplierId: string | null
    supplierName: string | null
    reason: string | null
    notes: string | null
    movementDate: Date
    createdBy: string
    creatorName: string
    reversalOfMovementId: string | null
    reversedByMovementId: string | null
    createdAt: Date
}

export type InventorySummaryEntity = {
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
