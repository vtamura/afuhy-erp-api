import type { ExampleEntity } from '../entities/example.entity'

export interface ExampleRepository {
    list(): Promise<ExampleEntity[]>
}
