import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    InventoryMovementEntity,
    InventoryMovementType,
    InventoryProductEntity,
    InventoryStatus,
    InventorySummaryEntity,
    InventoryUnit,
    InventoryVariantEntity,
} from '../../domain/entities/inventory.entity'
import type {
    InventoryMovementFilters,
    InventoryProductData,
    InventoryProductFilters,
    InventoryRepository,
    InventoryVariantData,
} from '../../domain/repositories/inventory.repository'

type VariantJson = {
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
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

type ProductRow = {
    id: string
    organization_id: string
    name: string
    description: string | null
    unit: InventoryUnit
    status: InventoryStatus
    variants: VariantJson[]
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

type VariantRow = {
    id: string
    organization_id: string
    product_id: string
    name: string
    sku: string
    barcode: string | null
    sale_price: string
    average_cost: string
    current_quantity: string
    minimum_quantity: string
    status: InventoryStatus
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

type MovementRow = {
    id: string
    organization_id: string
    product_id: string
    product_name: string
    variant_id: string
    variant_name: string
    variant_sku: string
    type: InventoryMovementType
    quantity: string
    unit_cost: string
    total_cost: string
    supplier_id: string | null
    supplier_name: string | null
    reason: string | null
    notes: string | null
    movement_date: Date
    created_by: string
    creator_name: string
    reversal_of_movement_id: string | null
    reversed_by_movement_id: string | null
    created_at: Date
}

const variantJson = `
    JSONB_BUILD_OBJECT(
        'id', variants.id,
        'organizationId', variants.organization_id,
        'productId', variants.product_id,
        'name', variants.name,
        'sku', variants.sku,
        'barcode', variants.barcode,
        'salePrice', variants.sale_price::TEXT,
        'averageCost', variants.average_cost::TEXT,
        'currentQuantity', variants.current_quantity::TEXT,
        'minimumQuantity', variants.minimum_quantity::TEXT,
        'status', variants.status,
        'createdAt', variants.created_at,
        'updatedAt', variants.updated_at,
        'deletedAt', variants.deleted_at
    )
`

const movementSelect = `
    SELECT
        movements.*,
        products.name AS product_name,
        variants.name AS variant_name,
        variants.sku AS variant_sku,
        suppliers.name AS supplier_name,
        users.name AS creator_name,
        reversal.id AS reversed_by_movement_id
    FROM inventory_movements movements
    INNER JOIN inventory_products products
        ON products.id = movements.product_id
    INNER JOIN inventory_variants variants
        ON variants.id = movements.variant_id
    INNER JOIN users
        ON users.id = movements.created_by
    LEFT JOIN suppliers
        ON suppliers.id = movements.supplier_id
    LEFT JOIN inventory_movements reversal
        ON reversal.reversal_of_movement_id = movements.id
`

export class PostgresInventoryRepository implements InventoryRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async createProduct(
        data: InventoryProductData,
    ): Promise<InventoryProductEntity> {
        return this.databaseClient.transaction(async (databaseClient) => {
            const [product] = await databaseClient.query<{ id: string }>(
                `
                    INSERT INTO inventory_products (
                        organization_id, name, description, unit, status
                    )
                    VALUES (
                        :organizationId, :name, :description, :unit, :status
                    )
                    RETURNING id
                `,
                data,
            )
            for (const variant of data.variants) {
                await this.insertVariant(databaseClient, {
                    organizationId: data.organizationId,
                    productId: product.id,
                    data: variant,
                })
            }
            return (await this.selectProduct(databaseClient, {
                id: product.id,
                organizationId: data.organizationId,
            }))!
        })
    }

    async listProducts(
        filters: InventoryProductFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const { where, replacements } = this.productFilters(filters)
        const offset = (pagination.page - 1) * pagination.pageSize
        const ids = await this.databaseClient.select<{ id: string }>(
            `
                SELECT DISTINCT products.id, products.name
                FROM inventory_products products
                LEFT JOIN inventory_variants variants
                    ON variants.product_id = products.id
                    AND variants.deleted_at IS NULL
                ${where}
                ORDER BY products.name, products.id
                LIMIT :pageSize OFFSET :offset
            `,
            { ...replacements, pageSize: pagination.pageSize, offset },
        )
        const [count] = await this.databaseClient.select<{ total: string }>(
            `
                SELECT COUNT(DISTINCT products.id)::TEXT AS total
                FROM inventory_products products
                LEFT JOIN inventory_variants variants
                    ON variants.product_id = products.id
                    AND variants.deleted_at IS NULL
                ${where}
            `,
            replacements,
        )
        const items = await Promise.all(
            ids.map((row) =>
                this.findProductById({
                    id: row.id,
                    organizationId: filters.organizationId,
                }),
            ),
        )
        return {
            items: items.filter(
                (item): item is InventoryProductEntity => item !== null,
            ),
            total: Number(count.total),
        }
    }

    findProductById(input: {
        id: string
        organizationId: string
    }): Promise<InventoryProductEntity | null> {
        return this.selectProduct(this.databaseClient, input)
    }

    async updateProduct(input: {
        id: string
        organizationId: string
        data: Omit<InventoryProductData, 'organizationId' | 'variants'>
    }) {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE inventory_products
                SET name = :name,
                    description = :description,
                    unit = :unit,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING id
            `,
            {
                ...input.data,
                id: input.id,
                organizationId: input.organizationId,
            },
        )
        return rows.length ? this.findProductById(input) : null
    }

    async softDeleteProduct(input: { id: string; organizationId: string }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            const rows = await databaseClient.query<{ id: string }>(
                `
                    UPDATE inventory_products
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE id = :id
                        AND organization_id = :organizationId
                        AND deleted_at IS NULL
                    RETURNING id
                `,
                input,
            )
            if (!rows.length) return false
            await databaseClient.query(
                `
                    UPDATE inventory_variants
                    SET deleted_at = NOW(), updated_at = NOW()
                    WHERE product_id = :id
                        AND organization_id = :organizationId
                        AND deleted_at IS NULL
                `,
                input,
            )
            return true
        })
    }

    productHasMovements(input: { id: string; organizationId: string }) {
        return this.hasMovement('product_id', input)
    }

    async addVariant(input: {
        organizationId: string
        productId: string
        data: InventoryVariantData
    }) {
        const id = await this.insertVariant(this.databaseClient, input)
        return (await this.findVariantById({
            id,
            organizationId: input.organizationId,
        }))!
    }

    async findVariantById(input: { id: string; organizationId: string }) {
        const [row] = await this.databaseClient.select<VariantRow>(
            `
                SELECT *
                FROM inventory_variants
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )
        return row ? this.toVariant(row) : null
    }

    findVariantBySku(input: { organizationId: string; sku: string }) {
        return this.findVariantByField('sku', input)
    }

    findVariantByBarcode(input: { organizationId: string; barcode: string }) {
        return this.findVariantByField('barcode', input)
    }

    async updateVariant(input: {
        id: string
        productId: string
        organizationId: string
        data: InventoryVariantData
    }) {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE inventory_variants
                SET name = :name,
                    sku = :sku,
                    barcode = :barcode,
                    sale_price = :salePrice,
                    minimum_quantity = :minimumQuantity,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
                    AND product_id = :productId
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING id
            `,
            { ...input.data, ...input },
        )
        return rows.length
            ? this.findVariantById({
                  id: input.id,
                  organizationId: input.organizationId,
              })
            : null
    }

    async softDeleteVariant(input: {
        id: string
        productId: string
        organizationId: string
    }) {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE inventory_variants
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = :id
                    AND product_id = :productId
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING id
            `,
            input,
        )
        return rows.length > 0
    }

    variantHasMovements(input: { id: string; organizationId: string }) {
        return this.hasMovement('variant_id', input)
    }

    async countActiveVariants(input: {
        productId: string
        organizationId: string
    }) {
        const [row] = await this.databaseClient.select<{ total: string }>(
            `
                SELECT COUNT(*)::TEXT AS total
                FROM inventory_variants
                WHERE product_id = :productId
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
            `,
            input,
        )
        return Number(row.total)
    }

    createMovement(input: {
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
        return this.databaseClient.transaction(async (databaseClient) => {
            const variant = await this.lockActiveVariant(databaseClient, input)
            const signedQuantity =
                input.type === 'ENTRY' ? input.quantity : `-${input.quantity}`
            if (
                input.type === 'EXIT' &&
                Number(variant.current_quantity) < Number(input.quantity)
            ) {
                throw new ConflictError('Estoque insuficiente')
            }
            const unitCost =
                input.type === 'ENTRY' ? input.unitCost! : variant.average_cost
            const averageCost =
                input.type === 'ENTRY'
                    ? await this.averageCost(databaseClient, {
                          currentQuantity: variant.current_quantity,
                          currentAverageCost: variant.average_cost,
                          addedQuantity: input.quantity,
                          addedUnitCost: unitCost,
                      })
                    : variant.average_cost
            await this.updateBalance(databaseClient, {
                variantId: variant.id,
                organizationId: input.organizationId,
                quantity: signedQuantity,
                averageCost,
            })
            const id = await this.insertMovement(databaseClient, {
                ...input,
                productId: variant.product_id,
                quantity: signedQuantity,
                unitCost,
                reversalOfMovementId: null,
            })
            return (await this.selectMovement(databaseClient, {
                id,
                organizationId: input.organizationId,
            }))!
        })
    }

    createAdjustment(input: {
        organizationId: string
        variantId: string
        countedQuantity: string
        unitCost: string | null
        reason: string
        notes: string | null
        movementDate: Date
        createdBy: string
    }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            const variant = await this.lockActiveVariant(databaseClient, input)
            const [difference] = await databaseClient.select<{
                quantity: string
            }>(
                `
                    SELECT (
                        CAST(:countedQuantity AS NUMERIC) -
                        CAST(:currentQuantity AS NUMERIC)
                    )::NUMERIC(15, 3)::TEXT AS quantity
                `,
                {
                    countedQuantity: input.countedQuantity,
                    currentQuantity: variant.current_quantity,
                },
            )
            if (Number(difference.quantity) === 0) return null
            const unitCost =
                Number(difference.quantity) > 0
                    ? (input.unitCost ?? variant.average_cost)
                    : variant.average_cost
            const averageCost =
                Number(difference.quantity) > 0
                    ? await this.averageCost(databaseClient, {
                          currentQuantity: variant.current_quantity,
                          currentAverageCost: variant.average_cost,
                          addedQuantity: difference.quantity,
                          addedUnitCost: unitCost,
                      })
                    : variant.average_cost
            await this.updateBalance(databaseClient, {
                variantId: variant.id,
                organizationId: input.organizationId,
                quantity: difference.quantity,
                averageCost,
            })
            const id = await this.insertMovement(databaseClient, {
                ...input,
                productId: variant.product_id,
                type: 'ADJUSTMENT',
                quantity: difference.quantity,
                unitCost,
                supplierId: null,
                reversalOfMovementId: null,
            })
            return this.selectMovement(databaseClient, {
                id,
                organizationId: input.organizationId,
            })
        })
    }

    reverseMovement(input: {
        id: string
        organizationId: string
        reason: string
        movementDate: Date
        createdBy: string
    }) {
        return this.databaseClient.transaction(async (databaseClient) => {
            const original = await this.lockMovement(databaseClient, input)
            if (original.reversed_by_movement_id) {
                throw new ConflictError('Movimento ja estornado')
            }
            const variant = await this.lockActiveVariant(databaseClient, {
                variantId: original.variant_id,
                organizationId: input.organizationId,
            })
            const inverseQuantity = `${-Number(original.quantity)}`
            if (
                Number(variant.current_quantity) + Number(inverseQuantity) <
                0
            ) {
                throw new ConflictError('Estorno deixaria o estoque negativo')
            }
            const averageCost =
                Number(inverseQuantity) > 0
                    ? await this.averageCost(databaseClient, {
                          currentQuantity: variant.current_quantity,
                          currentAverageCost: variant.average_cost,
                          addedQuantity: inverseQuantity,
                          addedUnitCost: original.unit_cost,
                      })
                    : variant.average_cost
            await this.updateBalance(databaseClient, {
                variantId: variant.id,
                organizationId: input.organizationId,
                quantity: inverseQuantity,
                averageCost,
            })
            const id = await this.insertMovement(databaseClient, {
                organizationId: input.organizationId,
                productId: original.product_id,
                variantId: original.variant_id,
                type: 'ADJUSTMENT',
                quantity: inverseQuantity,
                unitCost: original.unit_cost,
                supplierId: original.supplier_id,
                reason: input.reason,
                notes: `Estorno do movimento ${original.id}`,
                movementDate: input.movementDate,
                createdBy: input.createdBy,
                reversalOfMovementId: original.id,
            })
            return (await this.selectMovement(databaseClient, {
                id,
                organizationId: input.organizationId,
            }))!
        })
    }

    async listMovements(
        filters: InventoryMovementFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const { where, replacements } = this.movementFilters(filters)
        const offset = (pagination.page - 1) * pagination.pageSize
        const rows = await this.databaseClient.select<MovementRow>(
            `
                ${movementSelect}
                ${where}
                ORDER BY movements.movement_date DESC, movements.created_at DESC
                LIMIT :pageSize OFFSET :offset
            `,
            { ...replacements, pageSize: pagination.pageSize, offset },
        )
        const [count] = await this.databaseClient.select<{ total: string }>(
            `
                SELECT COUNT(*)::TEXT AS total
                FROM inventory_movements movements
                ${where}
            `,
            replacements,
        )
        return {
            items: rows.map((row) => this.toMovement(row)),
            total: Number(count.total),
        }
    }

    findMovementById(input: { id: string; organizationId: string }) {
        return this.selectMovement(this.databaseClient, input)
    }

    async supplierIsActive(input: { id: string; organizationId: string }) {
        const rows = await this.databaseClient.select<{ id: string }>(
            `
                SELECT id FROM suppliers
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND status = 'ACTIVE'
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )
        return rows.length > 0
    }

    async getSummary(organizationId: string): Promise<InventorySummaryEntity> {
        const [totals] = await this.databaseClient.select<{
            active_products: string
            active_skus: string
            total_quantity: string
            total_value: string
            zero_stock_count: string
            low_stock_count: string
        }>(
            `
                SELECT
                    COUNT(DISTINCT products.id) FILTER (
                        WHERE products.status = 'ACTIVE'
                    )::TEXT AS active_products,
                    COUNT(variants.id) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                    )::TEXT AS active_skus,
                    COALESCE(SUM(variants.current_quantity) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                    ), 0)::NUMERIC(18, 3)::TEXT AS total_quantity,
                    COALESCE(SUM(
                        variants.current_quantity * variants.average_cost
                    ) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                    ), 0)::NUMERIC(18, 2)::TEXT AS total_value,
                    COUNT(variants.id) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                            AND variants.current_quantity = 0
                    )::TEXT AS zero_stock_count,
                    COUNT(variants.id) FILTER (
                        WHERE products.status = 'ACTIVE'
                            AND variants.status = 'ACTIVE'
                            AND variants.current_quantity <
                                variants.minimum_quantity
                    )::TEXT AS low_stock_count
                FROM inventory_products products
                LEFT JOIN inventory_variants variants
                    ON variants.product_id = products.id
                    AND variants.deleted_at IS NULL
                WHERE products.organization_id = :organizationId
                    AND products.deleted_at IS NULL
            `,
            { organizationId },
        )
        const items = await this.databaseClient.select<{
            product_id: string
            product_name: string
            variant_id: string
            variant_name: string
            sku: string
            current_quantity: string
            minimum_quantity: string
        }>(
            `
                SELECT
                    products.id AS product_id,
                    products.name AS product_name,
                    variants.id AS variant_id,
                    variants.name AS variant_name,
                    variants.sku,
                    variants.current_quantity::TEXT,
                    variants.minimum_quantity::TEXT
                FROM inventory_variants variants
                INNER JOIN inventory_products products
                    ON products.id = variants.product_id
                WHERE variants.organization_id = :organizationId
                    AND products.status = 'ACTIVE'
                    AND variants.status = 'ACTIVE'
                    AND products.deleted_at IS NULL
                    AND variants.deleted_at IS NULL
                    AND variants.current_quantity <
                        variants.minimum_quantity
                ORDER BY
                    (variants.minimum_quantity - variants.current_quantity)
                        DESC,
                    products.name,
                    variants.name
                LIMIT 20
            `,
            { organizationId },
        )
        return {
            activeProducts: Number(totals.active_products),
            activeSkus: Number(totals.active_skus),
            totalQuantity: totals.total_quantity,
            totalValue: totals.total_value,
            zeroStockCount: Number(totals.zero_stock_count),
            lowStockCount: Number(totals.low_stock_count),
            lowStockItems: items.map((row) => ({
                productId: row.product_id,
                productName: row.product_name,
                variantId: row.variant_id,
                variantName: row.variant_name,
                sku: row.sku,
                currentQuantity: row.current_quantity,
                minimumQuantity: row.minimum_quantity,
            })),
        }
    }

    private async insertVariant(
        databaseClient: DatabaseClient,
        input: {
            organizationId: string
            productId: string
            data: InventoryVariantData
        },
    ) {
        const [row] = await databaseClient.query<{ id: string }>(
            `
                INSERT INTO inventory_variants (
                    organization_id, product_id, name, sku, barcode,
                    sale_price, minimum_quantity, status
                )
                VALUES (
                    :organizationId, :productId, :name, :sku, :barcode,
                    :salePrice, :minimumQuantity, :status
                )
                RETURNING id
            `,
            { ...input.data, ...input },
        )
        return row.id
    }

    private async selectProduct(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        const [row] = await databaseClient.select<ProductRow>(
            `
                SELECT
                    products.*,
                    COALESCE(
                        JSONB_AGG(${variantJson} ORDER BY variants.name)
                        FILTER (WHERE variants.id IS NOT NULL),
                        '[]'::jsonb
                    ) AS variants
                FROM inventory_products products
                LEFT JOIN inventory_variants variants
                    ON variants.product_id = products.id
                    AND variants.deleted_at IS NULL
                WHERE products.id = :id
                    AND products.organization_id = :organizationId
                    AND products.deleted_at IS NULL
                GROUP BY products.id
                LIMIT 1
            `,
            input,
        )
        return row ? this.toProduct(row) : null
    }

    private async findVariantByField(
        field: 'sku' | 'barcode',
        input: { organizationId: string; sku?: string; barcode?: string },
    ) {
        const [row] = await this.databaseClient.select<VariantRow>(
            `
                SELECT *
                FROM inventory_variants
                WHERE organization_id = :organizationId
                    AND ${field} = :value
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            {
                organizationId: input.organizationId,
                value: field === 'sku' ? input.sku : input.barcode,
            },
        )
        return row ? this.toVariant(row) : null
    }

    private async hasMovement(
        column: 'product_id' | 'variant_id',
        input: { id: string; organizationId: string },
    ) {
        const rows = await this.databaseClient.select<{ id: string }>(
            `
                SELECT id FROM inventory_movements
                WHERE ${column} = :id
                    AND organization_id = :organizationId
                LIMIT 1
            `,
            input,
        )
        return rows.length > 0
    }

    private async lockActiveVariant(
        databaseClient: DatabaseClient,
        input: { variantId: string; organizationId: string },
    ) {
        const [row] = await databaseClient.select<VariantRow>(
            `
                SELECT variants.*
                FROM inventory_variants variants
                INNER JOIN inventory_products products
                    ON products.id = variants.product_id
                WHERE variants.id = :variantId
                    AND variants.organization_id = :organizationId
                    AND variants.status = 'ACTIVE'
                    AND products.status = 'ACTIVE'
                    AND variants.deleted_at IS NULL
                    AND products.deleted_at IS NULL
                FOR UPDATE OF variants
            `,
            input,
        )
        if (!row) {
            throw new NotFoundError('Variante ativa nao encontrada')
        }
        return row
    }

    private async updateBalance(
        databaseClient: DatabaseClient,
        input: {
            variantId: string
            organizationId: string
            quantity: string
            averageCost: string
        },
    ) {
        await databaseClient.query(
            `
                UPDATE inventory_variants
                SET current_quantity =
                        current_quantity + CAST(:quantity AS NUMERIC),
                    average_cost = :averageCost,
                    updated_at = NOW()
                WHERE id = :variantId
                    AND organization_id = :organizationId
            `,
            input,
        )
    }

    private async averageCost(
        databaseClient: DatabaseClient,
        input: {
            currentQuantity: string
            currentAverageCost: string
            addedQuantity: string
            addedUnitCost: string
        },
    ) {
        const [row] = await databaseClient.select<{ average_cost: string }>(
            `
                SELECT CASE
                    WHEN (
                        CAST(:currentQuantity AS NUMERIC) +
                        CAST(:addedQuantity AS NUMERIC)
                    ) = 0 THEN '0.00'
                    ELSE ROUND((
                        CAST(:currentQuantity AS NUMERIC) *
                            CAST(:currentAverageCost AS NUMERIC) +
                        CAST(:addedQuantity AS NUMERIC) *
                            CAST(:addedUnitCost AS NUMERIC)
                    ) / (
                        CAST(:currentQuantity AS NUMERIC) +
                        CAST(:addedQuantity AS NUMERIC)
                    ), 2)::TEXT
                END AS average_cost
            `,
            input,
        )
        return row.average_cost
    }

    private async insertMovement(
        databaseClient: DatabaseClient,
        input: {
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
        },
    ) {
        const [row] = await databaseClient.query<{ id: string }>(
            `
                INSERT INTO inventory_movements (
                    organization_id, product_id, variant_id, type, quantity,
                    unit_cost, total_cost, supplier_id, reason, notes,
                    movement_date, created_by, reversal_of_movement_id
                )
                VALUES (
                    :organizationId, :productId, :variantId, :type, :quantity,
                    :unitCost,
                    ABS(
                        CAST(:quantity AS NUMERIC) *
                        CAST(:unitCost AS NUMERIC)
                    ),
                    :supplierId, :reason, :notes, :movementDate, :createdBy,
                    :reversalOfMovementId
                )
                RETURNING id
            `,
            input,
        )
        return row.id
    }

    private async selectMovement(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        const [row] = await databaseClient.select<MovementRow>(
            `
                ${movementSelect}
                WHERE movements.id = :id
                    AND movements.organization_id = :organizationId
                LIMIT 1
            `,
            input,
        )
        return row ? this.toMovement(row) : null
    }

    private async lockMovement(
        databaseClient: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        const [row] = await databaseClient.select<MovementRow>(
            `
                ${movementSelect}
                WHERE movements.id = :id
                    AND movements.organization_id = :organizationId
                FOR UPDATE OF movements
            `,
            input,
        )
        if (!row) throw new NotFoundError('Movimento nao encontrado')
        return row
    }

    private productFilters(filters: InventoryProductFilters) {
        const clauses = [
            'products.organization_id = :organizationId',
            'products.deleted_at IS NULL',
        ]
        const replacements: Record<string, unknown> = {
            organizationId: filters.organizationId,
        }
        if (filters.status) {
            clauses.push('products.status = :status')
            replacements.status = filters.status
        }
        if (filters.search) {
            clauses.push(`(
                products.name ILIKE :search OR
                variants.name ILIKE :search OR
                variants.sku ILIKE :search OR
                variants.barcode ILIKE :search
            )`)
            replacements.search = `%${filters.search}%`
        }
        if (filters.lowStock !== undefined) {
            clauses.push(
                filters.lowStock
                    ? 'variants.current_quantity < variants.minimum_quantity'
                    : '(variants.id IS NULL OR variants.current_quantity >= variants.minimum_quantity)',
            )
        }
        return {
            where: `WHERE ${clauses.join('\n AND ')}`,
            replacements,
        }
    }

    private movementFilters(filters: InventoryMovementFilters) {
        const clauses = ['movements.organization_id = :organizationId']
        const replacements: Record<string, unknown> = {
            organizationId: filters.organizationId,
        }
        const fields: Array<[string, unknown, string]> = [
            ['productId', filters.productId, 'movements.product_id'],
            ['variantId', filters.variantId, 'movements.variant_id'],
            ['type', filters.type, 'movements.type'],
            ['supplierId', filters.supplierId, 'movements.supplier_id'],
        ]
        for (const [key, value, column] of fields) {
            if (value !== undefined) {
                clauses.push(`${column} = :${key}`)
                replacements[key] = value
            }
        }
        if (filters.startDate) {
            clauses.push('movements.movement_date >= :startDate')
            replacements.startDate = filters.startDate
        }
        if (filters.endDate) {
            clauses.push('movements.movement_date <= :endDate')
            replacements.endDate = filters.endDate
        }
        return {
            where: `WHERE ${clauses.join('\n AND ')}`,
            replacements,
        }
    }

    private toProduct(row: ProductRow): InventoryProductEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            description: row.description,
            unit: row.unit,
            status: row.status,
            variants: row.variants.map((variant) => ({
                ...variant,
                createdAt: new Date(variant.createdAt),
                updatedAt: new Date(variant.updatedAt),
                deletedAt: variant.deletedAt
                    ? new Date(variant.deletedAt)
                    : null,
            })),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        }
    }

    private toVariant(row: VariantRow): InventoryVariantEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            productId: row.product_id,
            name: row.name,
            sku: row.sku,
            barcode: row.barcode,
            salePrice: row.sale_price,
            averageCost: row.average_cost,
            currentQuantity: row.current_quantity,
            minimumQuantity: row.minimum_quantity,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        }
    }

    private toMovement(row: MovementRow): InventoryMovementEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            productId: row.product_id,
            productName: row.product_name,
            variantId: row.variant_id,
            variantName: row.variant_name,
            variantSku: row.variant_sku,
            type: row.type,
            quantity: row.quantity,
            unitCost: row.unit_cost,
            totalCost: row.total_cost,
            supplierId: row.supplier_id,
            supplierName: row.supplier_name,
            reason: row.reason,
            notes: row.notes,
            movementDate: new Date(row.movement_date),
            createdBy: row.created_by,
            creatorName: row.creator_name,
            reversalOfMovementId: row.reversal_of_movement_id,
            reversedByMovementId: row.reversed_by_movement_id,
            createdAt: new Date(row.created_at),
        }
    }
}
