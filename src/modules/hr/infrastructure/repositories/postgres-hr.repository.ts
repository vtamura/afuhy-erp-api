import type { DatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import { getDatabaseClient } from '../../../../shared/infrastructure/database/sequelize.client'
import type {
    EmployeeAssignmentEntity,
    EmployeeEntity,
    EmployeeStatus,
    HrCatalogEntity,
    HrCatalogStatus,
    HrSummaryEntity,
    SalaryChangeEntity,
} from '../../domain/entities/hr.entity'
import type {
    EmployeeData,
    EmployeeFilters,
    HrCatalogData,
    HrCatalogType,
    HrRepository,
} from '../../domain/repositories/hr.repository'

type CatalogRow = {
    id: string
    organization_id: string
    name: string
    description: string | null
    status: HrCatalogStatus
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}
type EmployeeRow = {
    id: string
    organization_id: string
    organization_user_id: string | null
    member_name: string | null
    member_email: string | null
    department_id: string
    department_name: string
    position_id: string
    position_name: string
    name: string
    cpf: string
    registration: string
    email: string | null
    phone: string | null
    birth_date: string | null
    hire_date: string
    current_salary: string
    status: EmployeeStatus
    termination_date: string | null
    termination_reason: string | null
    notes: string | null
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}
type AssignmentRow = {
    id: string
    organization_id: string
    employee_id: string
    department_id: string
    department_name: string
    position_id: string
    position_name: string
    effective_date: string
    reason: string | null
    created_by: string
    creator_name: string
    created_at: Date
}
type SalaryRow = {
    id: string
    organization_id: string
    employee_id: string
    salary: string
    effective_date: string
    reason: string | null
    created_by: string
    creator_name: string
    created_at: Date
}

const employeeSelect = `
    SELECT
        employees.*,
        departments.name AS department_name,
        positions.name AS position_name,
        users.name AS member_name,
        users.email AS member_email
    FROM hr_employees employees
    INNER JOIN hr_departments departments ON departments.id = employees.department_id
    INNER JOIN hr_positions positions ON positions.id = employees.position_id
    LEFT JOIN organization_users organization_users
        ON organization_users.id = employees.organization_user_id
    LEFT JOIN users users ON users.id = organization_users.user_id
`

const catalogTable = (type: HrCatalogType) =>
    type === 'department' ? 'hr_departments' : 'hr_positions'
const catalogColumn = (type: HrCatalogType) =>
    type === 'department' ? 'department_id' : 'position_id'

export class PostgresHrRepository implements HrRepository {
    constructor(
        private readonly databaseClient: DatabaseClient = getDatabaseClient(),
    ) {}

    async createCatalog(type: HrCatalogType, data: HrCatalogData) {
        const [row] = await this.databaseClient.query<CatalogRow>(
            `
                INSERT INTO ${catalogTable(type)}
                    (organization_id, name, description, status)
                VALUES (:organizationId, :name, :description, :status)
                RETURNING *
            `,
            data,
        )
        return this.toCatalog(row)
    }

    async listCatalog(type: HrCatalogType, organizationId: string) {
        const rows = await this.databaseClient.select<CatalogRow>(
            `
                SELECT *
                FROM ${catalogTable(type)}
                WHERE organization_id = :organizationId
                    AND deleted_at IS NULL
                ORDER BY name
            `,
            { organizationId },
        )
        return rows.map((row) => this.toCatalog(row))
    }

    async findCatalogById(input: {
        type: HrCatalogType
        id: string
        organizationId: string
    }) {
        const [row] = await this.databaseClient.select<CatalogRow>(
            `
                SELECT *
                FROM ${catalogTable(input.type)}
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )
        return row ? this.toCatalog(row) : null
    }

    async findCatalogByName(input: {
        type: HrCatalogType
        organizationId: string
        name: string
    }) {
        const [row] = await this.databaseClient.select<CatalogRow>(
            `
                SELECT *
                FROM ${catalogTable(input.type)}
                WHERE organization_id = :organizationId
                    AND LOWER(name) = LOWER(:name)
                    AND deleted_at IS NULL
                LIMIT 1
            `,
            input,
        )
        return row ? this.toCatalog(row) : null
    }

    async updateCatalog(input: {
        type: HrCatalogType
        id: string
        organizationId: string
        data: Omit<HrCatalogData, 'organizationId'>
    }) {
        const [row] = await this.databaseClient.query<CatalogRow>(
            `
                UPDATE ${catalogTable(input.type)}
                SET name = :name,
                    description = :description,
                    status = :status,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING *
            `,
            { ...input, ...input.data },
        )
        return row ? this.toCatalog(row) : null
    }

    async deleteCatalog(input: {
        type: HrCatalogType
        id: string
        organizationId: string
    }) {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE ${catalogTable(input.type)}
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING id
            `,
            input,
        )
        return rows.length > 0
    }

    async catalogHasReferences(input: {
        type: HrCatalogType
        id: string
        organizationId: string
    }) {
        const column = catalogColumn(input.type)
        const historyTable =
            input.type === 'department'
                ? 'hr_employee_assignments'
                : 'hr_employee_assignments'
        const [row] = await this.databaseClient.select<{ found: boolean }>(
            `
                SELECT EXISTS (
                    SELECT 1 FROM hr_employees
                    WHERE organization_id = :organizationId
                        AND ${column} = :id
                        AND deleted_at IS NULL
                    UNION ALL
                    SELECT 1 FROM ${historyTable}
                    WHERE organization_id = :organizationId
                        AND ${column} = :id
                ) AS found
            `,
            input,
        )
        return Boolean(row?.found)
    }

    async createEmployee(input: {
        data: EmployeeData
        createdBy: string
    }): Promise<EmployeeEntity> {
        return this.databaseClient.transaction(async (client) => {
            const [row] = await client.query<{ id: string }>(
                `
                    INSERT INTO hr_employees (
                        organization_id, organization_user_id, department_id,
                        position_id, name, cpf, registration, email, phone,
                        birth_date, hire_date, current_salary, status,
                        termination_date, termination_reason, notes
                    )
                    VALUES (
                        :organizationId, :organizationUserId, :departmentId,
                        :positionId, :name, :cpf, :registration, :email, :phone,
                        :birthDate, :hireDate, :currentSalary, :status,
                        :terminationDate, :terminationReason, :notes
                    )
                    RETURNING id
                `,
                input.data,
            )
            await client.query(
                `
                    INSERT INTO hr_employee_assignments (
                        organization_id, employee_id, department_id, position_id,
                        effective_date, reason, created_by
                    )
                    VALUES (
                        :organizationId, :employeeId, :departmentId, :positionId,
                        :effectiveDate, 'Admissao', :createdBy
                    )
                `,
                {
                    organizationId: input.data.organizationId,
                    employeeId: row.id,
                    departmentId: input.data.departmentId,
                    positionId: input.data.positionId,
                    effectiveDate: input.data.hireDate,
                    createdBy: input.createdBy,
                },
            )
            await client.query(
                `
                    INSERT INTO hr_salary_changes (
                        organization_id, employee_id, salary, effective_date,
                        reason, created_by
                    )
                    VALUES (
                        :organizationId, :employeeId, :salary, :effectiveDate,
                        'Admissao', :createdBy
                    )
                `,
                {
                    organizationId: input.data.organizationId,
                    employeeId: row.id,
                    salary: input.data.currentSalary,
                    effectiveDate: input.data.hireDate,
                    createdBy: input.createdBy,
                },
            )
            return (await this.selectEmployee(client, {
                id: row.id,
                organizationId: input.data.organizationId,
            }))!
        })
    }

    async listEmployees(
        filters: EmployeeFilters,
        pagination: { page: number; pageSize: number },
    ) {
        const conditions = [
            'employees.organization_id = :organizationId',
            'employees.deleted_at IS NULL',
        ]
        const replacements: Record<string, unknown> = { ...filters }
        if (filters.status) conditions.push('employees.status = :status')
        if (filters.departmentId)
            conditions.push('employees.department_id = :departmentId')
        if (filters.positionId)
            conditions.push('employees.position_id = :positionId')
        if (filters.organizationUserId)
            conditions.push(
                'employees.organization_user_id = :organizationUserId',
            )
        if (filters.search) {
            conditions.push(`(
                employees.name ILIKE :search
                OR employees.cpf ILIKE :search
                OR employees.registration ILIKE :search
                OR employees.email ILIKE :search
            )`)
            replacements.search = `%${filters.search}%`
        }
        const where = conditions.join(' AND ')
        const offset = (pagination.page - 1) * pagination.pageSize
        const rows = await this.databaseClient.select<EmployeeRow>(
            `${employeeSelect}
             WHERE ${where}
             ORDER BY employees.name
             LIMIT :pageSize OFFSET :offset`,
            { ...replacements, pageSize: pagination.pageSize, offset },
        )
        const [count] = await this.databaseClient.select<{ total: string }>(
            `SELECT COUNT(*)::TEXT AS total
             FROM hr_employees employees
             WHERE ${where}`,
            replacements,
        )
        return {
            items: rows.map((row) => this.toEmployee(row)),
            total: Number(count.total),
        }
    }

    async findEmployeeById(input: { id: string; organizationId: string }) {
        return this.selectEmployee(this.databaseClient, input)
    }

    async findEmployeeByUnique(input: {
        organizationId: string
        field: 'cpf' | 'registration' | 'organization_user_id'
        value: string
    }) {
        const [row] = await this.databaseClient.select<EmployeeRow>(
            `${employeeSelect}
             WHERE employees.organization_id = :organizationId
                AND employees.${input.field} = :value
                AND employees.deleted_at IS NULL
             LIMIT 1`,
            input,
        )
        return row ? this.toEmployee(row) : null
    }

    async updateEmployee(input: {
        id: string
        organizationId: string
        data: Omit<
            EmployeeData,
            'organizationId' | 'departmentId' | 'positionId' | 'currentSalary'
        >
    }) {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE hr_employees
                SET organization_user_id = :organizationUserId,
                    name = :name,
                    cpf = :cpf,
                    registration = :registration,
                    email = :email,
                    phone = :phone,
                    birth_date = :birthDate,
                    status = :status,
                    termination_date = :terminationDate,
                    termination_reason = :terminationReason,
                    notes = :notes,
                    updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING id
            `,
            { ...input, ...input.data },
        )
        return rows.length
            ? this.selectEmployee(this.databaseClient, {
                  id: input.id,
                  organizationId: input.organizationId,
              })
            : null
    }

    async deleteEmployee(input: { id: string; organizationId: string }) {
        const rows = await this.databaseClient.query<{ id: string }>(
            `
                UPDATE hr_employees
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE id = :id
                    AND organization_id = :organizationId
                    AND deleted_at IS NULL
                RETURNING id
            `,
            input,
        )
        return rows.length > 0
    }

    async employeeHasAdditionalHistory(input: {
        id: string
        organizationId: string
    }) {
        const [row] = await this.databaseClient.select<{ found: boolean }>(
            `
                SELECT (
                    (SELECT COUNT(*) FROM hr_employee_assignments
                     WHERE employee_id = :id AND organization_id = :organizationId) > 1
                    OR
                    (SELECT COUNT(*) FROM hr_salary_changes
                     WHERE employee_id = :id AND organization_id = :organizationId) > 1
                ) AS found
            `,
            input,
        )
        return Boolean(row?.found)
    }

    async memberIsActive(input: { id: string; organizationId: string }) {
        const [row] = await this.databaseClient.select<{ found: boolean }>(
            `
                SELECT EXISTS (
                    SELECT 1 FROM organization_users
                    WHERE id = :id
                        AND organization_id = :organizationId
                        AND status = 'ACTIVE'
                ) AS found
            `,
            input,
        )
        return Boolean(row?.found)
    }

    async createAssignment(input: {
        employeeId: string
        organizationId: string
        departmentId: string
        positionId: string
        effectiveDate: string
        reason: string | null
        createdBy: string
    }) {
        return this.databaseClient.transaction(async (client) => {
            const [row] = await client.query<{ id: string }>(
                `
                    INSERT INTO hr_employee_assignments (
                        organization_id, employee_id, department_id, position_id,
                        effective_date, reason, created_by
                    )
                    VALUES (
                        :organizationId, :employeeId, :departmentId, :positionId,
                        :effectiveDate, :reason, :createdBy
                    )
                    RETURNING id
                `,
                input,
            )
            await client.query(
                `
                    UPDATE hr_employees
                    SET department_id = :departmentId,
                        position_id = :positionId,
                        updated_at = NOW()
                    WHERE id = :employeeId
                        AND organization_id = :organizationId
                `,
                input,
            )
            return (await this.selectAssignment(
                client,
                row.id,
                input.organizationId,
            ))!
        })
    }

    async listAssignments(input: {
        employeeId: string
        organizationId: string
    }) {
        const rows = await this.databaseClient.select<AssignmentRow>(
            `
                SELECT assignments.*,
                    departments.name AS department_name,
                    positions.name AS position_name,
                    users.name AS creator_name
                FROM hr_employee_assignments assignments
                INNER JOIN hr_departments departments
                    ON departments.id = assignments.department_id
                INNER JOIN hr_positions positions
                    ON positions.id = assignments.position_id
                INNER JOIN users ON users.id = assignments.created_by
                WHERE assignments.employee_id = :employeeId
                    AND assignments.organization_id = :organizationId
                ORDER BY assignments.effective_date DESC, assignments.created_at DESC
            `,
            input,
        )
        return rows.map((row) => this.toAssignment(row))
    }

    async createSalaryChange(input: {
        employeeId: string
        organizationId: string
        salary: string
        effectiveDate: string
        reason: string | null
        createdBy: string
    }) {
        return this.databaseClient.transaction(async (client) => {
            const [row] = await client.query<{ id: string }>(
                `
                    INSERT INTO hr_salary_changes (
                        organization_id, employee_id, salary, effective_date,
                        reason, created_by
                    )
                    VALUES (
                        :organizationId, :employeeId, :salary, :effectiveDate,
                        :reason, :createdBy
                    )
                    RETURNING id
                `,
                input,
            )
            await client.query(
                `
                    UPDATE hr_employees
                    SET current_salary = :salary, updated_at = NOW()
                    WHERE id = :employeeId
                        AND organization_id = :organizationId
                `,
                input,
            )
            return (await this.selectSalary(
                client,
                row.id,
                input.organizationId,
            ))!
        })
    }

    async listSalaryChanges(input: {
        employeeId: string
        organizationId: string
    }) {
        const rows = await this.databaseClient.select<SalaryRow>(
            `
                SELECT changes.*, users.name AS creator_name
                FROM hr_salary_changes changes
                INNER JOIN users ON users.id = changes.created_by
                WHERE changes.employee_id = :employeeId
                    AND changes.organization_id = :organizationId
                ORDER BY changes.effective_date DESC, changes.created_at DESC
            `,
            input,
        )
        return rows.map((row) => this.toSalary(row))
    }

    async getSummary(input: {
        organizationId: string
        periodStart: string
        periodEnd: string
    }): Promise<HrSummaryEntity> {
        const [total] = await this.databaseClient.select<{ total: string }>(
            `SELECT COUNT(*)::TEXT AS total FROM hr_employees
             WHERE organization_id = :organizationId AND deleted_at IS NULL`,
            input,
        )
        const byStatus = await this.databaseClient.select<{
            status: EmployeeStatus
            total: string
        }>(
            `SELECT status, COUNT(*)::TEXT AS total FROM hr_employees
             WHERE organization_id = :organizationId AND deleted_at IS NULL
             GROUP BY status ORDER BY status`,
            input,
        )
        const byDepartment = await this.databaseClient.select<{
            id: string
            name: string
            total: string
        }>(
            `SELECT departments.id, departments.name, COUNT(employees.id)::TEXT AS total
             FROM hr_departments departments
             LEFT JOIN hr_employees employees
                ON employees.department_id = departments.id
                AND employees.deleted_at IS NULL
             WHERE departments.organization_id = :organizationId
                AND departments.deleted_at IS NULL
             GROUP BY departments.id, departments.name
             ORDER BY departments.name`,
            input,
        )
        const byPosition = await this.databaseClient.select<{
            id: string
            name: string
            total: string
        }>(
            `SELECT positions.id, positions.name, COUNT(employees.id)::TEXT AS total
             FROM hr_positions positions
             LEFT JOIN hr_employees employees
                ON employees.position_id = positions.id
                AND employees.deleted_at IS NULL
             WHERE positions.organization_id = :organizationId
                AND positions.deleted_at IS NULL
             GROUP BY positions.id, positions.name
             ORDER BY positions.name`,
            input,
        )
        const [movements] = await this.databaseClient.select<{
            admissions: string
            terminations: string
        }>(
            `SELECT
                COUNT(*) FILTER (
                    WHERE hire_date BETWEEN :periodStart AND :periodEnd
                )::TEXT AS admissions,
                COUNT(*) FILTER (
                    WHERE termination_date BETWEEN :periodStart AND :periodEnd
                )::TEXT AS terminations
             FROM hr_employees
             WHERE organization_id = :organizationId AND deleted_at IS NULL`,
            input,
        )
        return {
            totalEmployees: Number(total.total),
            byStatus: byStatus.map((item) => ({
                status: item.status,
                total: Number(item.total),
            })),
            byDepartment: byDepartment.map((item) => ({
                ...item,
                total: Number(item.total),
            })),
            byPosition: byPosition.map((item) => ({
                ...item,
                total: Number(item.total),
            })),
            admissions: Number(movements.admissions),
            terminations: Number(movements.terminations),
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
        }
    }

    private async selectEmployee(
        client: DatabaseClient,
        input: { id: string; organizationId: string },
    ) {
        const [row] = await client.select<EmployeeRow>(
            `${employeeSelect}
             WHERE employees.id = :id
                AND employees.organization_id = :organizationId
                AND employees.deleted_at IS NULL
             LIMIT 1`,
            input,
        )
        return row ? this.toEmployee(row) : null
    }

    private async selectAssignment(
        client: DatabaseClient,
        id: string,
        organizationId: string,
    ) {
        const [row] = await client.select<AssignmentRow>(
            `
                SELECT assignments.*,
                    departments.name AS department_name,
                    positions.name AS position_name,
                    users.name AS creator_name
                FROM hr_employee_assignments assignments
                INNER JOIN hr_departments departments
                    ON departments.id = assignments.department_id
                INNER JOIN hr_positions positions
                    ON positions.id = assignments.position_id
                INNER JOIN users ON users.id = assignments.created_by
                WHERE assignments.id = :id
                    AND assignments.organization_id = :organizationId
            `,
            { id, organizationId },
        )
        return row ? this.toAssignment(row) : null
    }

    private async selectSalary(
        client: DatabaseClient,
        id: string,
        organizationId: string,
    ) {
        const [row] = await client.select<SalaryRow>(
            `
                SELECT changes.*, users.name AS creator_name
                FROM hr_salary_changes changes
                INNER JOIN users ON users.id = changes.created_by
                WHERE changes.id = :id
                    AND changes.organization_id = :organizationId
            `,
            { id, organizationId },
        )
        return row ? this.toSalary(row) : null
    }

    private toCatalog(row: CatalogRow): HrCatalogEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            name: row.name,
            description: row.description,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
        }
    }

    private toEmployee(row: EmployeeRow): EmployeeEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            organizationUserId: row.organization_user_id,
            memberName: row.member_name,
            memberEmail: row.member_email,
            departmentId: row.department_id,
            departmentName: row.department_name,
            positionId: row.position_id,
            positionName: row.position_name,
            name: row.name,
            cpf: row.cpf,
            registration: row.registration,
            email: row.email,
            phone: row.phone,
            birthDate: row.birth_date ? String(row.birth_date) : null,
            hireDate: String(row.hire_date),
            currentSalary: String(row.current_salary),
            status: row.status,
            terminationDate: row.termination_date
                ? String(row.termination_date)
                : null,
            terminationReason: row.termination_reason,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
        }
    }

    private toAssignment(row: AssignmentRow): EmployeeAssignmentEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            employeeId: row.employee_id,
            departmentId: row.department_id,
            departmentName: row.department_name,
            positionId: row.position_id,
            positionName: row.position_name,
            effectiveDate: String(row.effective_date),
            reason: row.reason,
            createdBy: row.created_by,
            creatorName: row.creator_name,
            createdAt: row.created_at,
        }
    }

    private toSalary(row: SalaryRow): SalaryChangeEntity {
        return {
            id: row.id,
            organizationId: row.organization_id,
            employeeId: row.employee_id,
            salary: String(row.salary),
            effectiveDate: String(row.effective_date),
            reason: row.reason,
            createdBy: row.created_by,
            creatorName: row.creator_name,
            createdAt: row.created_at,
        }
    }
}
