import { cp, copyFile, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = resolve(projectRoot, 'dist')
const distDatabaseDirectory = resolve(distDirectory, 'database')
const distMigrationsDirectory = resolve(distDatabaseDirectory, 'migrations')

await mkdir(distDatabaseDirectory, { recursive: true })
await rm(distMigrationsDirectory, { recursive: true, force: true })
await cp(resolve(projectRoot, 'database/migrations'), distMigrationsDirectory, {
    recursive: true,
})
await copyFile(
    resolve(projectRoot, 'sequelize.config.cjs'),
    resolve(distDirectory, 'sequelize.config.cjs'),
)
