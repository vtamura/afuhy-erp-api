import type { ExampleRepository } from '../../domain/repositories/example.repository'
import { toExampleResponseDto } from '../mappers/example-response.mapper'
import type { ExampleResponseDto } from '../dto'

export class ListExamplesUseCase {
    constructor(private readonly exampleRepository: ExampleRepository) {}

    public async execute(): Promise<ExampleResponseDto[]> {
        const examples = await this.exampleRepository.list()

        return examples.map(toExampleResponseDto)
    }
}
