import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from '../../../../shared/domain/errors'
import {
    calculateAverageCost,
    calculateTotalCost,
    millisToQuantity,
    quantityToMillis,
} from '../../domain/decimal/inventory-decimal'
import type {
    InventoryMovementEntity,
    InventoryMovementType,
    InventoryProductEntity,
    InventoryStatus,
    InventorySummaryEntity,
    InventoryVariantEntity,
} from '../../domain/entities/inventory.entity'
import type {
    InventoryMovementFilters,
    InventoryProductData,
    InventoryProductFilters,
    InventoryRepository,
    InventoryVariantData,
} from '../../domain/repositories/inventory.repository'
import {
    AddInventoryVariantUseCase,
    CreateInventoryAdjustmentUseCase,
    CreateInventoryMovementUseCase,
    CreateInventoryProductUseCase,
    DeleteInventoryProductUseCase,
    DeleteInventoryVariantUseCase,
    GetInventorySummaryUseCase,
    ListInventoryMovementsUseCase,
    ListInventoryProductsUseCase,
    ReverseInventoryMovementUseCase,
    UpdateInventoryProductUseCase,
    UpdateInventoryVariantUseCase,
} from '.'

const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'
const otherOrganizationId = '77a4cace-b14f-4a0d-b7fa-406be4b139cc'
const userId = '3ccbcefd-b996-4362-94bb-46955de8813e'
const supplierId = 'ae3ab197-55ce-46c8-91f2-37b1b78160f2'
const now = new Date('2026-06-18T12:00:00.000Z')

class InMemoryInventoryRepository implements InventoryRepository {
    products: InventoryProductEntity[] = []
    movements: InventoryMovementEntity[] = []
    activeSuppliers = new Set([`${organizationId}:${supplierId}`])

    async createProduct(data: InventoryProductData) {
        const productId = `product-${this.products.length + 1}`
        const product: InventoryProductEntity = {
            id: productId,
            organizationId: data.organizationId,
            name: data.name,
            description: data.description,
            unit: data.unit,
            status: data.status,
            variants: data.variants.map((variant, index) =>
                this.variant(
                    `variant-${this.products.length + 1}-${index + 1}`,
                    productId,
                    data.organizationId,
                    variant,
                ),
            ),
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }
        this.products.push(product)
        return product
    }

    async listProducts(
        filters: InventoryProductFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const filtered = this.products.filter((product) => {
            if (
                product.organizationId !== filters.organizationId ||
                product.deletedAt
            )
                return false
            if (filters.status && product.status !== filters.status)
                return false
            if (
                filters.search &&
                !`${product.name} ${product.variants
                    .map((variant) => `${variant.name} ${variant.sku}`)
                    .join(' ')}`
                    .toLowerCase()
                    .includes(filters.search.toLowerCase())
            )
                return false
            const hasLow = product.variants.some(
                (variant) =>
                    !variant.deletedAt &&
                    quantityToMillis(variant.currentQuantity) <
                        quantityToMillis(variant.minimumQuantity),
            )
            return filters.lowStock === undefined || hasLow === filters.lowStock
        })
        const offset = (pagination.page - 1) * pagination.pageSize
        return {
            items: filtered.slice(offset, offset + pagination.pageSize),
            total: filtered.length,
        }
    }

    async findProductById(input: { id: string; organizationId: string }) {
        return (
            this.products.find(
                (product) =>
                    product.id === input.id &&
                    product.organizationId === input.organizationId &&
                    !product.deletedAt,
            ) ?? null
        )
    }

    async updateProduct(input: {
        id: string
        organizationId: string
        data: Omit<InventoryProductData, 'organizationId' | 'variants'>
    }) {
        const product = await this.findProductById(input)
        if (!product) return null
        Object.assign(product, input.data, { updatedAt: now })
        return product
    }

    async softDeleteProduct(input: { id: string; organizationId: string }) {
        const product = await this.findProductById(input)
        if (!product) return false
        product.deletedAt = now
        product.variants.forEach((variant) => (variant.deletedAt = now))
        return true
    }

    async productHasMovements(input: { id: string; organizationId: string }) {
        return this.movements.some(
            (movement) =>
                movement.productId === input.id &&
                movement.organizationId === input.organizationId,
        )
    }

    async addVariant(input: {
        organizationId: string
        productId: string
        data: InventoryVariantData
    }) {
        const product = (await this.findProductById({
            id: input.productId,
            organizationId: input.organizationId,
        }))!
        const variant = this.variant(
            `variant-${product.variants.length + 1}`,
            product.id,
            product.organizationId,
            input.data,
        )
        product.variants.push(variant)
        return variant
    }

    async findVariantById(input: { id: string; organizationId: string }) {
        return (
            this.products
                .filter(
                    (product) =>
                        product.organizationId === input.organizationId &&
                        !product.deletedAt,
                )
                .flatMap((product) => product.variants)
                .find(
                    (variant) => variant.id === input.id && !variant.deletedAt,
                ) ?? null
        )
    }

    findVariantBySku(input: { organizationId: string; sku: string }) {
        return this.findByIdentifier(input.organizationId, 'sku', input.sku)
    }

    findVariantByBarcode(input: { organizationId: string; barcode: string }) {
        return this.findByIdentifier(
            input.organizationId,
            'barcode',
            input.barcode,
        )
    }

    async updateVariant(input: {
        id: string
        productId: string
        organizationId: string
        data: InventoryVariantData
    }) {
        const variant = await this.findVariantById(input)
        if (!variant || variant.productId !== input.productId) return null
        Object.assign(variant, input.data, { updatedAt: now })
        return variant
    }

    async softDeleteVariant(input: {
        id: string
        productId: string
        organizationId: string
    }) {
        const variant = await this.findVariantById(input)
        if (!variant || variant.productId !== input.productId) return false
        variant.deletedAt = now
        return true
    }

    async variantHasMovements(input: { id: string; organizationId: string }) {
        return this.movements.some(
            (movement) =>
                movement.variantId === input.id &&
                movement.organizationId === input.organizationId,
        )
    }

    async countActiveVariants(input: {
        productId: string
        organizationId: string
    }) {
        const product = await this.findProductById({
            id: input.productId,
            organizationId: input.organizationId,
        })
        return (
            product?.variants.filter((variant) => !variant.deletedAt).length ??
            0
        )
    }

    async createMovement(input: {
        organizationId: string
        variantId: string
        type: 'ENTRY' | 'EXIT'
        quantity: string
        unitCost: string | null
        supplierId: string | null
        reason: string | null
        notes: string | null
        movementDate: Date
        createdBy: string
    }) {
        const variant = this.activeVariant(input)
        const quantity =
            input.type === 'ENTRY' ? input.quantity : `-${input.quantity}`
        if (
            quantityToMillis(variant.currentQuantity) +
                quantityToMillis(quantity) <
            0n
        ) {
            throw new ConflictError('Estoque insuficiente')
        }
        const unitCost =
            input.type === 'ENTRY' ? input.unitCost! : variant.averageCost
        if (input.type === 'ENTRY') {
            variant.averageCost = calculateAverageCost({
                currentQuantity: variant.currentQuantity,
                currentAverageCost: variant.averageCost,
                entryQuantity: input.quantity,
                entryUnitCost: unitCost,
            })
        }
        variant.currentQuantity = millisToQuantity(
            quantityToMillis(variant.currentQuantity) +
                quantityToMillis(quantity),
        )
        return this.addMovement({
            ...input,
            productId: variant.productId,
            quantity,
            unitCost,
            reversalOfMovementId: null,
        })
    }

    async createAdjustment(input: {
        organizationId: string
        variantId: string
        countedQuantity: string
        unitCost: string | null
        reason: string
        notes: string | null
        movementDate: Date
        createdBy: string
    }) {
        const variant = this.activeVariant(input)
        const difference =
            quantityToMillis(input.countedQuantity) -
            quantityToMillis(variant.currentQuantity)
        if (difference === 0n) return null
        const quantity = millisToQuantity(difference)
        const unitCost = input.unitCost ?? variant.averageCost
        if (difference > 0n) {
            variant.averageCost = calculateAverageCost({
                currentQuantity: variant.currentQuantity,
                currentAverageCost: variant.averageCost,
                entryQuantity: quantity,
                entryUnitCost: unitCost,
            })
        }
        variant.currentQuantity = input.countedQuantity
        return this.addMovement({
            ...input,
            productId: variant.productId,
            type: 'ADJUSTMENT',
            quantity,
            unitCost,
            supplierId: null,
            reversalOfMovementId: null,
        })
    }

    async reverseMovement(input: {
        id: string
        organizationId: string
        reason: string
        movementDate: Date
        createdBy: string
    }) {
        const original = (await this.findMovementById(input))!
        const variant = this.activeVariant({
            organizationId: input.organizationId,
            variantId: original.variantId,
        })
        const inverse = millisToQuantity(-quantityToMillis(original.quantity))
        if (
            quantityToMillis(variant.currentQuantity) +
                quantityToMillis(inverse) <
            0n
        )
            throw new ConflictError('Estorno deixaria o estoque negativo')
        variant.currentQuantity = millisToQuantity(
            quantityToMillis(variant.currentQuantity) +
                quantityToMillis(inverse),
        )
        const reversal = this.addMovement({
            organizationId: input.organizationId,
            productId: original.productId,
            variantId: original.variantId,
            type: 'ADJUSTMENT',
            quantity: inverse,
            unitCost: original.unitCost,
            supplierId: original.supplierId,
            reason: input.reason,
            notes: null,
            movementDate: input.movementDate,
            createdBy: input.createdBy,
            reversalOfMovementId: original.id,
        })
        original.reversedByMovementId = reversal.id
        return reversal
    }

    async listMovements(
        filters: InventoryMovementFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const items = this.movements.filter((movement) => {
            if (movement.organizationId !== filters.organizationId) return false
            if (filters.productId && movement.productId !== filters.productId)
                return false
            if (filters.variantId && movement.variantId !== filters.variantId)
                return false
            if (filters.type && movement.type !== filters.type) return false
            if (
                filters.supplierId &&
                movement.supplierId !== filters.supplierId
            )
                return false
            if (filters.startDate && movement.movementDate < filters.startDate)
                return false
            if (filters.endDate && movement.movementDate > filters.endDate)
                return false
            return true
        })
        const offset = (pagination.page - 1) * pagination.pageSize
        return {
            items: items.slice(offset, offset + pagination.pageSize),
            total: items.length,
        }
    }

    async findMovementById(input: { id: string; organizationId: string }) {
        return (
            this.movements.find(
                (movement) =>
                    movement.id === input.id &&
                    movement.organizationId === input.organizationId,
            ) ?? null
        )
    }

    async supplierIsActive(input: { id: string; organizationId: string }) {
        return this.activeSuppliers.has(`${input.organizationId}:${input.id}`)
    }

    async getSummary(organizationId: string): Promise<InventorySummaryEntity> {
        const products = this.products.filter(
            (product) =>
                product.organizationId === organizationId &&
                !product.deletedAt &&
                product.status === 'ACTIVE',
        )
        const variants = products
            .flatMap((product) =>
                product.variants.map((variant) => ({ product, variant })),
            )
            .filter(
                ({ variant }) =>
                    !variant.deletedAt && variant.status === 'ACTIVE',
            )
        const low = variants.filter(
            ({ variant }) =>
                quantityToMillis(variant.currentQuantity) <
                quantityToMillis(variant.minimumQuantity),
        )
        return {
            activeProducts: products.length,
            activeSkus: variants.length,
            totalQuantity: millisToQuantity(
                variants.reduce(
                    (total, { variant }) =>
                        total + quantityToMillis(variant.currentQuantity),
                    0n,
                ),
            ),
            totalValue: variants
                .reduce(
                    (total, { variant }) =>
                        total +
                        Number(
                            calculateTotalCost(
                                variant.currentQuantity,
                                variant.averageCost,
                            ),
                        ),
                    0,
                )
                .toFixed(2),
            zeroStockCount: variants.filter(
                ({ variant }) => variant.currentQuantity === '0.000',
            ).length,
            lowStockCount: low.length,
            lowStockItems: low.map(({ product, variant }) => ({
                productId: product.id,
                productName: product.name,
                variantId: variant.id,
                variantName: variant.name,
                sku: variant.sku,
                currentQuantity: variant.currentQuantity,
                minimumQuantity: variant.minimumQuantity,
            })),
        }
    }

    private async findByIdentifier(
        organizationId: string,
        field: 'sku' | 'barcode',
        value: string,
    ) {
        return (
            this.products
                .filter(
                    (product) =>
                        product.organizationId === organizationId &&
                        !product.deletedAt,
                )
                .flatMap((product) => product.variants)
                .find(
                    (variant) => !variant.deletedAt && variant[field] === value,
                ) ?? null
        )
    }

    private activeVariant(input: {
        organizationId: string
        variantId: string
    }) {
        const product = this.products.find(
            (candidate) =>
                candidate.organizationId === input.organizationId &&
                candidate.status === 'ACTIVE' &&
                !candidate.deletedAt &&
                candidate.variants.some(
                    (variant) =>
                        variant.id === input.variantId &&
                        variant.status === 'ACTIVE' &&
                        !variant.deletedAt,
                ),
        )
        if (!product) throw new NotFoundError('Variante ativa nao encontrada')
        return product.variants.find(
            (variant) => variant.id === input.variantId,
        )!
    }

    private variant(
        id: string,
        productId: string,
        inputOrganizationId: string,
        data: InventoryVariantData,
    ): InventoryVariantEntity {
        return {
            id,
            organizationId: inputOrganizationId,
            productId,
            ...data,
            averageCost: '0.00',
            currentQuantity: '0.000',
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }
    }

    private addMovement(input: {
        organizationId: string
        productId: string
        variantId: string
        type: InventoryMovementType
        quantity: string
        unitCost: string
        supplierId: string | null
        reason: string | null
        notes: string | null
        movementDate: Date
        createdBy: string
        reversalOfMovementId: string | null
    }) {
        const product = this.products.find(
            (candidate) => candidate.id === input.productId,
        )!
        const variant = product.variants.find(
            (candidate) => candidate.id === input.variantId,
        )!
        const movement: InventoryMovementEntity = {
            id: `movement-${this.movements.length + 1}`,
            ...input,
            productName: product.name,
            variantName: variant.name,
            variantSku: variant.sku,
            totalCost: calculateTotalCost(input.quantity, input.unitCost),
            supplierName: input.supplierId ? 'Supplier' : null,
            creatorName: 'User',
            reversedByMovementId: null,
            createdAt: now,
        }
        this.movements.push(movement)
        return movement
    }
}

const variants = (sku = 'SKU-1'): InventoryVariantData[] => [
    {
        name: 'Padrao',
        sku,
        barcode: null,
        salePrice: '20.00',
        minimumQuantity: '2.000',
        status: 'ACTIVE',
    },
]

async function setup() {
    const repository = new InMemoryInventoryRepository()
    const product = await new CreateInventoryProductUseCase(repository).execute(
        {
            organizationId,
            name: 'Product',
            description: null,
            unit: 'UN',
            status: 'ACTIVE',
            variants: variants(),
        },
    )
    return { repository, product, variant: product.variants[0] }
}

describe('Inventory use cases', () => {
    it('creates products with variants and isolates identifiers by tenant', async () => {
        const repository = new InMemoryInventoryRepository()
        const create = new CreateInventoryProductUseCase(repository)
        const product = await create.execute({
            organizationId,
            name: 'Shirt',
            description: null,
            unit: 'UN',
            status: 'ACTIVE',
            variants: [...variants('SHIRT-M'), ...variants('SHIRT-G')],
        })
        await expect(
            create.execute({
                organizationId,
                name: 'Duplicate',
                description: null,
                unit: 'UN',
                status: 'ACTIVE',
                variants: variants('SHIRT-M'),
            }),
        ).rejects.toBeInstanceOf(ConflictError)
        await expect(
            create.execute({
                organizationId: otherOrganizationId,
                name: 'Other tenant',
                description: null,
                unit: 'UN',
                status: 'ACTIVE',
                variants: variants('SHIRT-M'),
            }),
        ).resolves.toBeDefined()
        expect(product.variants).toHaveLength(2)
    })

    it('calculates moving average cost and blocks negative stock', async () => {
        const { repository, variant } = await setup()
        const movement = new CreateInventoryMovementUseCase(repository)
        await movement.execute({
            organizationId,
            variantId: variant.id,
            type: 'ENTRY',
            quantity: '10.000',
            unitCost: '10.00',
            supplierId: null,
            reason: null,
            notes: null,
            movementDate: now,
            createdBy: userId,
        })
        await movement.execute({
            organizationId,
            variantId: variant.id,
            type: 'ENTRY',
            quantity: '10.000',
            unitCost: '20.00',
            supplierId: null,
            reason: null,
            notes: null,
            movementDate: now,
            createdBy: userId,
        })
        expect(
            (
                await repository.findVariantById({
                    id: variant.id,
                    organizationId,
                })
            )?.averageCost,
        ).toBe('15.00')
        await expect(
            movement.execute({
                organizationId,
                variantId: variant.id,
                type: 'EXIT',
                quantity: '21.000',
                unitCost: null,
                supplierId: null,
                reason: null,
                notes: null,
                movementDate: now,
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('uses active suppliers only for entries', async () => {
        const { repository, variant } = await setup()
        const useCase = new CreateInventoryMovementUseCase(repository)
        await expect(
            useCase.execute({
                organizationId,
                variantId: variant.id,
                type: 'ENTRY',
                quantity: '1.000',
                unitCost: '10.00',
                supplierId: '00000000-0000-4000-8000-000000000001',
                reason: null,
                notes: null,
                movementDate: now,
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(NotFoundError)
        await expect(
            useCase.execute({
                organizationId,
                variantId: variant.id,
                type: 'ENTRY',
                quantity: '1.000',
                unitCost: '10.00',
                supplierId,
                reason: null,
                notes: null,
                movementDate: now,
                createdBy: userId,
            }),
        ).resolves.toBeDefined()
    })

    it('adjusts counted stock and requires cost without valuation', async () => {
        const { repository, variant } = await setup()
        const adjustment = new CreateInventoryAdjustmentUseCase(repository)
        await expect(
            adjustment.execute({
                organizationId,
                variantId: variant.id,
                countedQuantity: '5.000',
                unitCost: null,
                reason: 'Inventory',
                notes: null,
                movementDate: now,
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(BadRequestError)
        await adjustment.execute({
            organizationId,
            variantId: variant.id,
            countedQuantity: '5.000',
            unitCost: '8.00',
            reason: 'Inventory',
            notes: null,
            movementDate: now,
            createdBy: userId,
        })
        await expect(
            adjustment.execute({
                organizationId,
                variantId: variant.id,
                countedQuantity: '5.000',
                unitCost: null,
                reason: 'Inventory',
                notes: null,
                movementDate: now,
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('reverses a movement once and restores stock', async () => {
        const { repository, variant } = await setup()
        const entry = await new CreateInventoryMovementUseCase(
            repository,
        ).execute({
            organizationId,
            variantId: variant.id,
            type: 'ENTRY',
            quantity: '5.000',
            unitCost: '10.00',
            supplierId: null,
            reason: null,
            notes: null,
            movementDate: now,
            createdBy: userId,
        })
        const reverse = new ReverseInventoryMovementUseCase(repository)
        await reverse.execute({
            id: entry.id,
            organizationId,
            reason: 'Wrong entry',
            movementDate: now,
            createdBy: userId,
        })
        expect(
            (
                await repository.findVariantById({
                    id: variant.id,
                    organizationId,
                })
            )?.currentQuantity,
        ).toBe('0.000')
        await expect(
            reverse.execute({
                id: entry.id,
                organizationId,
                reason: 'Again',
                movementDate: now,
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })

    it('filters products and movements with pagination', async () => {
        const { repository, product, variant } = await setup()
        await new CreateInventoryMovementUseCase(repository).execute({
            organizationId,
            variantId: variant.id,
            type: 'ENTRY',
            quantity: '1.000',
            unitCost: '5.00',
            supplierId: null,
            reason: null,
            notes: null,
            movementDate: now,
            createdBy: userId,
        })
        const products = await new ListInventoryProductsUseCase(
            repository,
        ).execute({
            organizationId,
            search: 'Product',
            page: 1,
            pageSize: 1,
        })
        const movements = await new ListInventoryMovementsUseCase(
            repository,
        ).execute({
            organizationId,
            productId: product.id,
            type: 'ENTRY',
            page: 1,
            pageSize: 1,
        })
        expect(products.pagination.total).toBe(1)
        expect(movements.pagination.total).toBe(1)
    })

    it('summarizes zero and low stock with valuation', async () => {
        const { repository, variant } = await setup()
        let summary = await new GetInventorySummaryUseCase(repository).execute({
            organizationId,
        })
        expect(summary).toMatchObject({
            activeProducts: 1,
            activeSkus: 1,
            zeroStockCount: 1,
            lowStockCount: 1,
        })
        await new CreateInventoryMovementUseCase(repository).execute({
            organizationId,
            variantId: variant.id,
            type: 'ENTRY',
            quantity: '3.000',
            unitCost: '10.00',
            supplierId: null,
            reason: null,
            notes: null,
            movementDate: now,
            createdBy: userId,
        })
        summary = await new GetInventorySummaryUseCase(repository).execute({
            organizationId,
        })
        expect(summary.totalValue).toBe('30.00')
        expect(summary.lowStockCount).toBe(0)
    })

    it('blocks movements for inactive resources', async () => {
        const { repository, product, variant } = await setup()
        await new UpdateInventoryProductUseCase(repository).execute({
            id: product.id,
            organizationId,
            name: product.name,
            description: product.description,
            unit: product.unit,
            status: 'INACTIVE',
        })
        await expect(
            new CreateInventoryMovementUseCase(repository).execute({
                organizationId,
                variantId: variant.id,
                type: 'ENTRY',
                quantity: '1.000',
                unitCost: '10.00',
                supplierId: null,
                reason: null,
                notes: null,
                movementDate: now,
                createdBy: userId,
            }),
        ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('soft deletes only catalog items without movement history', async () => {
        const { repository, product, variant } = await setup()
        await new AddInventoryVariantUseCase(repository).execute({
            id: product.id,
            organizationId,
            name: 'Extra',
            sku: 'SKU-EXTRA',
            barcode: null,
            salePrice: '10.00',
            minimumQuantity: '0.000',
            status: 'ACTIVE',
        })
        await new DeleteInventoryVariantUseCase(repository).execute({
            id: product.id,
            variantId: variant.id,
            organizationId,
        })
        await new DeleteInventoryProductUseCase(repository).execute({
            id: product.id,
            organizationId,
        })
        expect(
            await repository.findProductById({
                id: product.id,
                organizationId,
            }),
        ).toBeNull()
    })

    it('blocks deletion with movement history and validates variant uniqueness on update', async () => {
        const { repository, product, variant } = await setup()
        const second = await new AddInventoryVariantUseCase(repository).execute(
            {
                id: product.id,
                organizationId,
                name: 'Second',
                sku: 'SKU-2',
                barcode: 'BAR-2',
                salePrice: '10.00',
                minimumQuantity: '0.000',
                status: 'ACTIVE',
            },
        )
        await expect(
            new UpdateInventoryVariantUseCase(repository).execute({
                id: product.id,
                variantId: second.id,
                organizationId,
                sku: variant.sku,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
        await new CreateInventoryMovementUseCase(repository).execute({
            organizationId,
            variantId: variant.id,
            type: 'ENTRY',
            quantity: '1.000',
            unitCost: '10.00',
            supplierId: null,
            reason: null,
            notes: null,
            movementDate: now,
            createdBy: userId,
        })
        await expect(
            new DeleteInventoryProductUseCase(repository).execute({
                id: product.id,
                organizationId,
            }),
        ).rejects.toBeInstanceOf(ConflictError)
    })
})
