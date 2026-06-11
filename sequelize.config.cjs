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
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'qa_solutions',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: process.env.DB_DIALECT || 'mysql',
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
