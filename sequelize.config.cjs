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

const baseConfig = {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'afuhy',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
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
