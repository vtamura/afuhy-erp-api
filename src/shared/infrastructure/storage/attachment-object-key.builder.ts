import { env } from '../../config/env'
import type { StorageObjectContextType } from '../../application/ports/object-storage.port'

type BuildAttachmentObjectKeyInput = {
    contextType: StorageObjectContextType
    contextId: number
    fileName: string
    now?: Date
    uniqueSuffix?: string
}

function sanitizeFileName(fileName: string): string {
    return fileName
        .trim()
        .normalize('NFD')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
}

function resolveContextSegment(contextType: StorageObjectContextType): string {
    switch (contextType) {
        case 'TEST_CASE':
            return 'casos'
        case 'TEST_CASE_STEP':
            return 'passos'
        case 'TEST_EXECUTION':
            return 'execucoes'
    }
}

export function buildAttachmentObjectKey(
    input: BuildAttachmentObjectKeyInput
): string {
    const now = input.now ?? new Date()
    const sanitizedFileName = sanitizeFileName(input.fileName)
    const uniqueSuffix =
        input.uniqueSuffix ??
        `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`

    return [
        'qa-solutions',
        env.NODE_ENV,
        `${uniqueSuffix}-${sanitizedFileName}`,
    ].join('/')
}
