import path from 'node:path'

describe('sequelize.config.cjs', () => {
    const sequelizeConfigPath = path.resolve(
        process.cwd(),
        'sequelize.config.cjs',
    )

    function loadProductionConfig() {
        jest.resetModules()
        const config = require(sequelizeConfigPath)

        return config.production
    }

    beforeEach(() => {
        delete process.env.DB_USER
        delete process.env.DB_PASSWORD
        delete process.env.DB_NAME
        delete process.env.DB_HOST
        delete process.env.DB_PORT
        delete process.env.DATABASE_USER
        delete process.env.DATABASE_USERNAME
        delete process.env.DATABASE_PASSWORD
        delete process.env.DATABASE_NAME
        delete process.env.DATABASE_HOST
        delete process.env.DATABASE_PORT
        delete process.env.DATABASE_URL
        delete process.env.PGUSER
        delete process.env.PGPASSWORD
        delete process.env.PGDATABASE
        delete process.env.PGHOST
        delete process.env.PGPORT
        delete process.env.DB_DIALECT
        delete process.env.DB_LOG_SQL
    })

    it('uses DATABASE_* variables when DB_* variables are not provided', () => {
        process.env.DATABASE_USER = 'database-user'
        process.env.DATABASE_PASSWORD = 'database-password'
        process.env.DATABASE_NAME = 'database-name'
        process.env.DATABASE_HOST = 'database-host'
        process.env.DATABASE_PORT = '6543'

        const config = loadProductionConfig()

        expect(config.username).toBe('database-user')
        expect(config.password).toBe('database-password')
        expect(config.database).toBe('database-name')
        expect(config.host).toBe('database-host')
        expect(config.port).toBe(6543)
    })

    it('uses DATABASE_URL values when explicit database variables are missing', () => {
        process.env.DATABASE_URL = [
            'postgresql://',
            'url-user',
            ':',
            'url-password',
            '@url-host:6432/url-database',
        ].join('')

        const config = loadProductionConfig()

        expect(config.username).toBe('url-user')
        expect(config.password).toBe('url-password')
        expect(config.database).toBe('url-database')
        expect(config.host).toBe('url-host')
        expect(config.port).toBe(6432)
    })
})
