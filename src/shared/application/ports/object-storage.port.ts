export type StorageObjectContextType =
  | 'TEST_CASE'
  | 'TEST_CASE_STEP'
  | 'TEST_EXECUTION'

export type UploadObjectInput = {
  bucket: string
  objectKey: string
  contentType?: string | null
  body: Buffer
}

export type UploadObjectResult = {
  bucket: string
  objectKey: string
  etag?: string
}

export type GenerateDownloadUrlInput = {
  bucket: string
  objectKey: string
  expiresInSeconds?: number
}

export type GenerateDownloadUrlResult = {
  bucket: string
  objectKey: string
  downloadUrl: string
  expiresInSeconds: number
}

export interface ObjectStoragePort {
  uploadObject(input: UploadObjectInput): Promise<UploadObjectResult>
  generateDownloadUrl(
    input: GenerateDownloadUrlInput,
  ): Promise<GenerateDownloadUrlResult>
}
