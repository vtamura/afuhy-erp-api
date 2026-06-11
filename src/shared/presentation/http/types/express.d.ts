import type { AuthUser } from '../../../application/contracts'
import type { UploadedFile } from '../middlewares/upload.middleware'

export {}

declare global {
  namespace Express {
    interface Request {
      attributes?: unknown[]
      authUser?: AuthUser
      files?: UploadedFile[]
      requestId?: string
    }
  }
}
