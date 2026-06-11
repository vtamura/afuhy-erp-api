export type ExampleEntityProps = {
    id: string
    name: string
    description: string
}

export class ExampleEntity {
    public readonly id: string
    public readonly name: string
    public readonly description: string

    private constructor(props: ExampleEntityProps) {
        this.id = props.id
        this.name = props.name
        this.description = props.description
    }

    public static create(props: ExampleEntityProps): ExampleEntity {
        return new ExampleEntity(props)
    }
}
