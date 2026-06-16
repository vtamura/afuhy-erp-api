export type OpenApiSchema = Record<string, unknown>

export type OpenApiPathItem = Record<string, unknown>

export type OpenApiModuleDocument = {
    tags?: Array<{
        name: string
        description?: string
    }>
    schemas?: Record<string, OpenApiSchema>
    paths?: Record<string, OpenApiPathItem>
}
