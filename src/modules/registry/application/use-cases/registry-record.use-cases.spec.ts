import { ConflictError, NotFoundError } from '../../../../shared/domain/errors'
import type { RegistryRecordEntity } from '../../domain/entities/registry-record.entity'
import type {
    RegistryRecordData,
    RegistryRecordRepository,
    RegistryRecordUpdateData,
} from '../../domain/repositories/registry-record.repository'
import { CreateRegistryRecordUseCase } from './create-registry-record.use-case'
import { DeleteRegistryRecordUseCase } from './delete-registry-record.use-case'
import { GetRegistryRecordUseCase } from './get-registry-record.use-case'
import { ListRegistryRecordsUseCase } from './list-registry-records.use-case'
import { UpdateRegistryRecordUseCase } from './update-registry-record.use-case'

describe('Registry record use cases', () => {
    const organizationId = '59452bb1-ee59-45d3-8ab7-d35f3c12d53c'
    const otherOrganizationId = '77a4cace-b14f-4a0d-b7fa-406be4b139cc'

    function makeRepository(): RegistryRecordRepository {
        const records: RegistryRecordEntity[] = []

        return {
            async create(type, data) {
                const now = new Date()
                const record: RegistryRecordEntity = {
                    id: `${type}-${records.length + 1}`,
                    ...data,
                    createdAt: now,
                    updatedAt: now,
                    deletedAt: null,
                }
                records.push(record)
                return record
            },
            async listByOrganization(_type, inputOrganizationId) {
                return records.filter(
                    (record) =>
                        record.organizationId === inputOrganizationId &&
                        !record.deletedAt,
                )
            },
            async findById({ id, organizationId: inputOrganizationId }) {
                return (
                    records.find(
                        (record) =>
                            record.id === id &&
                            record.organizationId === inputOrganizationId &&
                            !record.deletedAt,
                    ) ?? null
                )
            },
            async findByDocument({
                organizationId: inputOrganizationId,
                document,
            }) {
                return (
                    records.find(
                        (record) =>
                            record.organizationId === inputOrganizationId &&
                            record.document === document &&
                            !record.deletedAt,
                    ) ?? null
                )
            },
            async update({ id, organizationId: inputOrganizationId, data }) {
                const record = records.find(
                    (candidate) =>
                        candidate.id === id &&
                        candidate.organizationId === inputOrganizationId &&
                        !candidate.deletedAt,
                )

                if (!record) {
                    return null
                }

                Object.assign(record, data, { updatedAt: new Date() })
                return record
            },
            async softDelete({ id, organizationId: inputOrganizationId }) {
                const record = records.find(
                    (candidate) =>
                        candidate.id === id &&
                        candidate.organizationId === inputOrganizationId &&
                        !candidate.deletedAt,
                )

                if (!record) {
                    return false
                }

                record.deletedAt = new Date()
                record.updatedAt = record.deletedAt
                return true
            },
        }
    }

    function baseInput(overrides: Partial<RegistryRecordData> = {}) {
        return {
            type: 'customer' as const,
            organizationId,
            name: 'Cliente Exemplo',
            document: '12345678000190',
            documentType: 'CNPJ' as const,
            email: 'cliente@afuhy.com.br',
            phone: '+5511999999999',
            notes: 'Observacao',
            status: 'ACTIVE' as const,
            ...overrides,
        }
    }

    it('creates a customer', async () => {
        const useCase = new CreateRegistryRecordUseCase(makeRepository())

        const result = await useCase.execute(baseInput())

        expect(result).toMatchObject({
            organizationId,
            name: 'Cliente Exemplo',
            document: '12345678000190',
            status: 'ACTIVE',
        })
    })

    it('blocks duplicated document in the same tenant', async () => {
        const repository = makeRepository()
        const useCase = new CreateRegistryRecordUseCase(repository)
        await useCase.execute(baseInput())

        await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
            ConflictError,
        )
    })

    it('allows the same document in another tenant', async () => {
        const repository = makeRepository()
        const useCase = new CreateRegistryRecordUseCase(repository)
        await useCase.execute(baseInput())

        const result = await useCase.execute(
            baseInput({ organizationId: otherOrganizationId }),
        )

        expect(result.organizationId).toBe(otherOrganizationId)
    })

    it('lists only active records from the selected tenant', async () => {
        const repository = makeRepository()
        const createUseCase = new CreateRegistryRecordUseCase(repository)
        const listUseCase = new ListRegistryRecordsUseCase(repository)
        await createUseCase.execute(baseInput({ name: 'Cliente A' }))
        await createUseCase.execute(
            baseInput({
                organizationId: otherOrganizationId,
                name: 'Cliente B',
                document: '99999999000199',
            }),
        )

        const result = await listUseCase.execute({
            type: 'customer',
            organizationId,
        })

        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('Cliente A')
    })

    it('gets a record respecting tenant and soft delete', async () => {
        const repository = makeRepository()
        const createUseCase = new CreateRegistryRecordUseCase(repository)
        const getUseCase = new GetRegistryRecordUseCase(repository)
        const created = await createUseCase.execute(baseInput())

        await expect(
            getUseCase.execute({
                type: 'customer',
                id: created.id,
                organizationId: otherOrganizationId,
            }),
        ).rejects.toBeInstanceOf(NotFoundError)

        const result = await getUseCase.execute({
            type: 'customer',
            id: created.id,
            organizationId,
        })

        expect(result.id).toBe(created.id)
    })

    it('updates a supplier', async () => {
        const repository = makeRepository()
        const createUseCase = new CreateRegistryRecordUseCase(repository)
        const updateUseCase = new UpdateRegistryRecordUseCase(repository)
        const created = await createUseCase.execute({
            ...baseInput(),
            type: 'supplier',
        })

        const data: RegistryRecordUpdateData = {
            name: 'Fornecedor Atualizado',
            document: '11111111000111',
            documentType: 'CNPJ',
            email: 'fornecedor@afuhy.com.br',
            phone: null,
            notes: null,
            status: 'INACTIVE',
        }
        const result = await updateUseCase.execute({
            type: 'supplier',
            id: created.id,
            organizationId,
            ...data,
        })

        expect(result).toMatchObject({
            name: 'Fornecedor Atualizado',
            status: 'INACTIVE',
        })
    })

    it('soft deletes a record', async () => {
        const repository = makeRepository()
        const createUseCase = new CreateRegistryRecordUseCase(repository)
        const deleteUseCase = new DeleteRegistryRecordUseCase(repository)
        const listUseCase = new ListRegistryRecordsUseCase(repository)
        const created = await createUseCase.execute(baseInput())

        await deleteUseCase.execute({
            type: 'customer',
            id: created.id,
            organizationId,
        })

        const result = await listUseCase.execute({
            type: 'customer',
            organizationId,
        })
        expect(result).toHaveLength(0)
    })
})
