import { QueryTypes, Sequelize, type Transaction } from 'sequelize'
import { env } from '../../config/env'

let sequelize: Sequelize | null = null

type QueryReplacements = Record<string, unknown> | unknown[]

export type MutationResult = {
    affectedRows: number
    insertId?: number
}

export interface DatabaseClient {
    query<T extends object>(
        query: string,
        replacements?: QueryReplacements,
    ): Promise<T[]>
    select<T extends object>(
        query: string,
        replacements?: QueryReplacements,
    ): Promise<T[]>
    insert(
        query: string,
        replacements?: QueryReplacements,
    ): Promise<MutationResult>
    update(
        query: string,
        replacements?: QueryReplacements,
    ): Promise<MutationResult>
    transaction<T>(
        callback: (databaseClient: DatabaseClient) => Promise<T>,
    ): Promise<T>
}

type MutationMetadata = {
    affectedRows?: unknown
    insertId?: unknown
}

export function getSequelizeClient(): Sequelize {
    if (sequelize) {
        return sequelize
    }

    sequelize = new Sequelize({
        dialect: env.DB_DIALECT,
        host: env.DB_HOST,
        port: env.DB_PORT,
        username: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        logging: env.DB_LOG_SQL ? console.log : false,
    })

    return sequelize
}

class SequelizeDatabaseClient implements DatabaseClient {
    constructor(
        private readonly sequelizeClient: Sequelize,
        private readonly transactionContext?: Transaction,
    ) {}

    async query<T extends object>(
        query: string,
        replacements?: QueryReplacements,
    ): Promise<T[]> {
        const [rows] = await this.sequelizeClient.query(query, {
            replacements,
            transaction: this.transactionContext,
        })

        return rows as T[]
    }

    async select<T extends object>(
        query: string,
        replacements?: QueryReplacements,
    ): Promise<T[]> {
        const rows = await this.sequelizeClient.query(query, {
            replacements,
            type: QueryTypes.SELECT,
            transaction: this.transactionContext,
        })

        return rows as T[]
    }

    async insert(
        query: string,
        replacements?: QueryReplacements,
    ): Promise<MutationResult> {
        const [result, metadata] = await this.sequelizeClient.query(query, {
            replacements,
            transaction: this.transactionContext,
        })

        return {
            affectedRows: metadata as unknown as number,
            insertId: result as unknown as number,
        }
    }

    async update(
        query: string,
        replacements?: QueryReplacements,
    ): Promise<MutationResult> {
        const [result, metadata] = await this.sequelizeClient.query(query, {
            replacements,
            transaction: this.transactionContext,
        })

        return this.extractMutationResult(result, metadata)
    }

    private extractMutationResult(
        result: unknown,
        metadata: unknown,
    ): MutationResult {
        const insertId = this.extractNumberField(result, metadata, 'insertId')
        const affectedRows = this.extractNumberField(
            result,
            metadata,
            'affectedRows',
        )

        return {
            affectedRows: affectedRows ?? 0,
            insertId,
        }
    }

    async transaction<T>(
        callback: (databaseClient: DatabaseClient) => Promise<T>,
    ): Promise<T> {
        return this.sequelizeClient.transaction(async (transaction) =>
            callback(
                new SequelizeDatabaseClient(this.sequelizeClient, transaction),
            ),
        )
    }

    private extractNumberField(
        result: unknown,
        metadata: unknown,
        field: keyof MutationMetadata,
    ): number | undefined {
        if (typeof metadata === 'number') {
            return metadata
        }

        const valueFromResult = this.readNumericField(result, field)

        if (valueFromResult !== undefined) {
            return valueFromResult
        }

        return this.readNumericField(metadata, field)
    }

    private readNumericField(
        candidate: unknown,
        field: keyof MutationMetadata,
    ): number | undefined {
        if (!candidate || typeof candidate !== 'object') {
            return undefined
        }

        const value = (candidate as MutationMetadata)[field]
        return typeof value === 'number' ? value : undefined
    }
}

let databaseClient: DatabaseClient | null = null

export function getDatabaseClient(): DatabaseClient {
    if (databaseClient) {
        return databaseClient
    }

    databaseClient = new SequelizeDatabaseClient(getSequelizeClient())
    return databaseClient
}

export async function closeSequelizeClient(): Promise<void> {
    if (!sequelize) {
        return
    }

    await sequelize.close()
    sequelize = null
    databaseClient = null
}
