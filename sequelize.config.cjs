const path = require('node:path')
const dotenv = require('dotenv')

const nodeEnv = process.env.NODE_ENV || 'development'

dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
})

dotenv.config({
    path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
    override: true,
})

function firstNonEmpty(...values) {
    return values.find(
        (value) => typeof value === 'string' && value.trim().length > 0,
    )
}

function parseDatabaseUrl(databaseUrl) {
    if (!databaseUrl) {
        return {}
    }

    try {
        const parsed = new URL(databaseUrl)

        if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
            return {}
        }

        return {
            username: parsed.username || undefined,
            password: parsed.password || undefined,
            database: parsed.pathname.replace(/^\//, '') || undefined,
            host: parsed.hostname || undefined,
            port: parsed.port || undefined,
        }
    } catch {
        return {}
    }
}

const databaseUrlConfig = parseDatabaseUrl(process.env.DATABASE_URL)

const baseConfig = {
    username:
        firstNonEmpty(
            process.env.DB_USER,
            process.env.DATABASE_USER,
            process.env.DATABASE_USERNAME,
            process.env.PGUSER,
            databaseUrlConfig.username,
        ) || 'postgres',
    password:
        firstNonEmpty(
            process.env.DB_PASSWORD,
            process.env.DATABASE_PASSWORD,
            process.env.PGPASSWORD,
            databaseUrlConfig.password,
        ) || 'postgres',
    database:
        firstNonEmpty(
            process.env.DB_NAME,
            process.env.DATABASE_NAME,
            process.env.PGDATABASE,
            databaseUrlConfig.database,
        ) || 'afuhy',
    host:
        firstNonEmpty(
            process.env.DB_HOST,
            process.env.DATABASE_HOST,
            process.env.PGHOST,
            databaseUrlConfig.host,
        ) || '127.0.0.1',
    port: Number(
        firstNonEmpty(
            process.env.DB_PORT,
            process.env.DATABASE_PORT,
            process.env.PGPORT,
            databaseUrlConfig.port,
        ) || 5432,
    ),
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: process.env.DB_LOG_SQL === 'true' ? console.log : false,
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_data',
}

module.exports = {
    development: baseConfig,
    qa: baseConfig,
    test: baseConfig,
    production: baseConfig,
}
