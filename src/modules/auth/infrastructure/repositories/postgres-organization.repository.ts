import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import {
    OrganizationEntity,
    type OrganizationDocumentType,
    type OrganizationStatus,
} from '../../domain/entities/organization.entity'
import type {
    CreateOrganizationInput,
    OrganizationRepository,
} from '../../domain/repositories/organization.repository'

type OrganizationRow = {
    id: string
    name: string
    document: string
    document_type: OrganizationDocumentType
    status: OrganizationStatus
    created_at: Date
    updated_at: Date
}

export class PostgresOrganizationRepository implements OrganizationRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async create(input: CreateOrganizationInput): Promise<OrganizationEntity> {
        const [row] = await this.databaseClient.query<OrganizationRow>(
            `
                INSERT INTO organizations (name, document, document_type)
                VALUES (:name, :document, :documentType)
                RETURNING id, name, document, document_type, status, created_at, updated_at
            `,
            input,
        )

        return this.toEntity(row)
    }

    async findByDocument(document: string): Promise<OrganizationEntity | null> {
        const [row] = await this.databaseClient.select<OrganizationRow>(
            `
                SELECT id, name, document, document_type, status, created_at, updated_at
                FROM organizations
                WHERE document = :document
                LIMIT 1
            `,
            { document },
        )

        return row ? this.toEntity(row) : null
    }

    async findById(id: string): Promise<OrganizationEntity | null> {
        const [row] = await this.databaseClient.select<OrganizationRow>(
            `
                SELECT id, name, document, document_type, status, created_at, updated_at
                FROM organizations
                WHERE id = :id
                LIMIT 1
            `,
            { id },
        )

        return row ? this.toEntity(row) : null
    }

    async listByUserId(userId: string): Promise<OrganizationEntity[]> {
        const rows = await this.databaseClient.select<OrganizationRow>(
            `
                SELECT o.id, o.name, o.document, o.document_type, o.status, o.created_at, o.updated_at
                FROM organizations o
                INNER JOIN organization_users ou
                    ON ou.organization_id = o.id
                    AND ou.status = 'ACTIVE'
                WHERE ou.user_id = :userId
                    AND o.status = 'ACTIVE'
                ORDER BY o.name ASC
            `,
            { userId },
        )

        return rows.map((row) => this.toEntity(row))
    }

    private toEntity(row: OrganizationRow): OrganizationEntity {
        return OrganizationEntity.create({
            id: row.id,
            name: row.name,
            document: row.document,
            documentType: row.document_type,
            status: row.status,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        })
    }
}
