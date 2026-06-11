import { InMemoryExampleRepository } from './infrastructure/repositories/in-memory-example.repository'
import { ListExamplesUseCase } from './application/use-cases'
import { ListExamplesController } from './presentation/http/controllers'
import { createExampleRouter } from './presentation/http/routes'

export type ExampleModule = {
    router: ReturnType<typeof createExampleRouter>
}

export function createExampleModule(): ExampleModule {
    const exampleRepository = new InMemoryExampleRepository()
    const listExamplesUseCase = new ListExamplesUseCase(exampleRepository)
    const listExamplesController = new ListExamplesController(
        listExamplesUseCase,
    )

    return {
        router: createExampleRouter({
            listExamplesController,
        }),
    }
}
