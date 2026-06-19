export type InventoryVariantResponseDto = {
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
    inventoryValue: string
    isLowStock: boolean
    status: 'ACTIVE' | 'INACTIVE'
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type InventoryProductResponseDto = {
    id: string
    organizationId: string
    name: string
    description: string | null
    unit: 'UN' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'CX'
    status: 'ACTIVE' | 'INACTIVE'
    variants: InventoryVariantResponseDto[]
    totalQuantity: string
    totalValue: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export type InventoryProductListResponseDto = {
    items: InventoryProductResponseDto[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

export type InventoryMovementResponseDto = {
    id: string
    organizationId: string
    productId: string
    productName: string
    variantId: string
    variantName: string
    variantSku: string
    type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT'
    quantity: string
    unitCost: string
    totalCost: string
    supplierId: string | null
    supplierName: string | null
    reason: string | null
    notes: string | null
    movementDate: string
    createdBy: string
    creatorName: string
    reversalOfMovementId: string | null
    reversedByMovementId: string | null
    createdAt: string
}

export type InventoryMovementListResponseDto = {
    items: InventoryMovementResponseDto[]
    pagination: {
        page: number
        pageSize: number
        total: number
        totalPages: number
    }
}

export type InventorySummaryResponseDto = {
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
