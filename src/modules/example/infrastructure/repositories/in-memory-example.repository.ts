import { ExampleEntity } from '../../domain/entities/example.entity'
import type { ExampleRepository } from '../../domain/repositories/example.repository'

const EXAMPLE_ITEMS = [
    ExampleEntity.create({
        id: 'example-module',
        name: 'Example module',
        description:
            'Referencia inicial para novos modulos com domain, application, infrastructure e presentation.',
    }),
]

export class InMemoryExampleRepository implements ExampleRepository {
    public async list() {
        return EXAMPLE_ITEMS
    }
}
