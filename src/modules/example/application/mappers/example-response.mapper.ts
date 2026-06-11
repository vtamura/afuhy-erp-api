import type { ExampleEntity } from '../../domain/entities/example.entity'
import type { ExampleResponseDto } from '../dto'

export function toExampleResponseDto(
    example: ExampleEntity,
): ExampleResponseDto {
    return {
        id: example.id,
        name: example.name,
        description: example.description,
    }
}
