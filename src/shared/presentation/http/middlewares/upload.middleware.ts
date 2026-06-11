import type { RequestHandler } from 'express'
import multer from 'multer'

export type UploadedFile = {
    fieldname: string
    originalname: string
    mimetype: string
    size: number
    buffer: Buffer
}

export function createUploadFilesMiddleware(
    fieldName = 'file',
    maxFiles = 1
): RequestHandler {
    const uploader = multer({
        storage: multer.memoryStorage(),
    })

    return uploader.array(fieldName, maxFiles)
}
