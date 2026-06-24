import type {
    InventoryMovementEntity,
    InventoryMovementPurpose,
    InventoryMovementType,
    InventoryProductEntity,
    InventoryStatus,
    InventorySummaryEntity,
    InventoryUnit,
    InventoryVariantEntity,
} from '../entities/inventory.entity'

export type InventoryVariantData = {
    name: string
    sku: string
    barcode: string | null
    salePrice: string
    minimumQuantity: string
    status: InventoryStatus
}

export type InventoryProductData = {
    organizationId: string
    name: string
    description: string | null
    unit: InventoryUnit
    status: InventoryStatus
    variants: InventoryVariantData[]
}

export type InventoryProductFilters = {
    organizationId: string
    status?: InventoryStatus
    search?: string
    lowStock?: boolean
}

export type InventoryMovementFilters = {
    organizationId: string
    productId?: string
    variantId?: string
    type?: InventoryMovementType
    supplierId?: string
    startDate?: Date
    endDate?: Date
}

export interface InventoryRepository {
    createProduct(data: InventoryProductData): Promise<InventoryProductEntity>
    listProducts(
        filters: InventoryProductFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<{ items: InventoryProductEntity[]; total: number }>
    findProductById(input: {
        id: string
        organizationId: string
    }): Promise<InventoryProductEntity | null>
    updateProduct(input: {
        id: string
        organizationId: string
        data: Omit<InventoryProductData, 'organizationId' | 'variants'>
    }): Promise<InventoryProductEntity | null>
    softDeleteProduct(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    productHasMovements(input: {
        id: string
        organizationId: string
    }): Promise<boolean>

    addVariant(input: {
        organizationId: string
        productId: string
        data: InventoryVariantData
    }): Promise<InventoryVariantEntity>
    findVariantById(input: {
        id: string
        organizationId: string
    }): Promise<InventoryVariantEntity | null>
    findVariantBySku(input: {
        organizationId: string
        sku: string
    }): Promise<InventoryVariantEntity | null>
    findVariantByBarcode(input: {
        organizationId: string
        barcode: string
    }): Promise<InventoryVariantEntity | null>
    updateVariant(input: {
        id: string
        productId: string
        organizationId: string
        data: InventoryVariantData
    }): Promise<InventoryVariantEntity | null>
    softDeleteVariant(input: {
        id: string
        productId: string
        organizationId: string
    }): Promise<boolean>
    variantHasMovements(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    countActiveVariants(input: {
        productId: string
        organizationId: string
    }): Promise<number>

    createMovement(input: {
        organizationId: string
        variantId: string
        type: Extract<InventoryMovementType, 'ENTRY' | 'EXIT'>
        quantity: string
        unitCost: string | null
        supplierId: string | null
        reason: string | null
        notes: string | null
        movementDate: Date
        createdBy: string
    }): Promise<InventoryMovementEntity>
    createLoanMovement(input: {
        organizationId: string
        variantId: string
        purpose: Extract<
            InventoryMovementPurpose,
            'LOAN_RELEASE' | 'LOAN_RETURN'
        >
        quantity: string
        unitCost: string
        originId: string
        originItemId: string
        notes: string | null
        movementDate: Date
        createdBy: string
    }): Promise<InventoryMovementEntity>
    createAdjustment(input: {
        organizationId: string
        variantId: string
        countedQuantity: string
        unitCost: string | null
        reason: string
        notes: string | null
        movementDate: Date
        createdBy: string
    }): Promise<InventoryMovementEntity | null>
    reverseMovement(input: {
        id: string
        organizationId: string
        reason: string
        movementDate: Date
        createdBy: string
    }): Promise<InventoryMovementEntity>
    listMovements(
        filters: InventoryMovementFilters,
        pagination: { page: number; pageSize: number },
    ): Promise<{ items: InventoryMovementEntity[]; total: number }>
    findMovementById(input: {
        id: string
        organizationId: string
    }): Promise<InventoryMovementEntity | null>
    supplierIsActive(input: {
        id: string
        organizationId: string
    }): Promise<boolean>
    getSummary(organizationId: string): Promise<InventorySummaryEntity>
}
