import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    RegistryDocumentType,
    RegistryRecordEntity,
    RegistryRecordStatus,
    RegistryRecordType,
} from '../../domain/entities/registry-record.entity'
import type {
    RegistryRecordData,
    RegistryRecordRepository,
    RegistryRecordUpdateData,
} from '../../domain/repositories/registry-record.repository'

type RegistryRecordRow = {
    id: string
    organization_id: string
    name: string
    document: string | null
    document_type: RegistryDocumentType | null
    email: string | null
    phone: string | null
    notes: string | null
    status: RegistryRecordStatus
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

const TABLES: Record<RegistryRecordType, string> = {
    customer: 'customers',
    supplier: 'suppliers',
}

export class PostgresRegistryRecordRepository implements RegistryRecordRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(
        type: RegistryRecordType,
        data: RegistryRecordData,
    ): Promise<RegistryRecordEntity> {
        const table = this.tableFor(type)
        const [row] = await this.databaseClient.query<RegistryRecordRow>(
            `
                INSERT INTO ${table} (
                    organization_id,
                    name,
                    document,
                    document_type,
                    email,
                    phone,
                    notes,
                    status
                )
                VALUES (
                    :organizationId,
                    :name,
                    :document,
                    :documentType,
                    :email,
                    :phone,
                    :notes,
                    :status
                )
                RETURNING *
            `,
            data,
        )

        return this.toEntity(row)
    }

    async listByOrganization(
        type: RegistryRecordType,
        organizationId: string,
    ): Promise<RegistryRecordEntity[]> {
        const table = this.tableFor(type)
        const rows = await this.databaseClient.select<RegistryRecordRow>(
            `
                SELECT *
                FROM ${table}
                WHERE organization_id = :organizationId
                    AND deleted_at IS NULL
                ORDER BY name ASC, created_at DESC
            `,
            { organizationId },
        )

        return rows.map((row) => this.toEntity(row))
    }

    async findById(input: {
        type: RegistryRecordType
        id: string
        organizationId: string
    }): Promise<RegistryRecordEntity | null> {
        const table = this.tableFor(input.type)
        const [row] = await this.databaseClient.select<RegistryRecordRow>(
            `
                SELECT *
                FROM ${table}
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async findByDocument(input: {
        type: RegistryRecordType
        organizationId: string
        document: string
    }): Promise<RegistryRecordEntity | null> {
        const table = this.tableFor(input.type)
        const [row] = await this.databaseClient.select<RegistryRecordRow>(
            `
                SELECT *
                FROM ${table}
                WHERE organization_id = :organizationId
                    AND document = :document
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )

        return row ? this.toEntity(row) : null
    }

    async update(input: {
        type: RegistryRecordType
        id: string
        organizationId: string
        data: RegistryRecordUpdateData
    }): Promise<RegistryRecordEntity | null> {
        const table = this.tableFor(input.type)
        const [row] = await this.databaseClient.query<RegistryRecordRow>(
            `
                UPDATE ${table}
                SET name = :name,
                    document = :document,
                    document_type = :documentType,
                    email = :email,
                    phone = :phone,
                    notes = :notes,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING *
            `,
            {
                id: input.id,
                organizationId: input.organizationId,
                ...input.data,
            },
        )

        return row ? this.toEntity(row) : null
    }

    async softDelete(input: {
        type: RegistryRecordType
        id: string
        organizationId: string
    }): Promise<boolean> {
        const table = this.tableFor(input.type)
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE ${table}
                SET deleted_at = NOW(),
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING id
            `,
            input,
        )

        return rows.length > 0
    }

    private tableFor(type: RegistryRecordType): string {
        return TABLES[type]
    }

    private toEntity(row: RegistryRecordRow): RegistryRecordEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            document: row.document,
            documentType: row.document_type,
            email: row.email,
            phone: row.phone,
            notes: row.notes,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
        }
    }
}
