import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../../config/env'
import type {
    GenerateDownloadUrlInput,
    GenerateDownloadUrlResult,
    ObjectStoragePort,
    UploadObjectInput,
    UploadObjectResult,
} from '../../application/ports/object-storage.port'

export class S3ObjectStorageClient implements ObjectStoragePort {
    private readonly client: S3Client

    constructor(client?: S3Client) {
        const credentials =
            env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
                ? {
                      accessKeyId: env.AWS_ACCESS_KEY_ID,
                      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
                  }
                : undefined

        this.client =
            client ??
            new S3Client({
                region: env.AWS_REGION,
                credentials,
            })
    }

    async uploadObject(input: UploadObjectInput): Promise<UploadObjectResult> {
        const command = new PutObjectCommand({
            Bucket: input.bucket,
            Key: input.objectKey,
            Body: input.body,
            ContentType: input.contentType ?? undefined,
        })

        const result = await this.client.send(command)

        return {
            bucket: input.bucket,
            objectKey: input.objectKey,
            etag: result.ETag,
        }
    }

    async generateDownloadUrl(
        input: GenerateDownloadUrlInput
    ): Promise<GenerateDownloadUrlResult> {
        const expiresInSeconds =
            input.expiresInSeconds ?? env.AWS_S3_DOWNLOAD_URL_EXPIRES_IN

        const command = new GetObjectCommand({
            Bucket: input.bucket,
            Key: input.objectKey,
        })

        const downloadUrl = await getSignedUrl(this.client, command, {
            expiresIn: expiresInSeconds,
        })

        return {
            bucket: input.bucket,
            objectKey: input.objectKey,
            downloadUrl,
            expiresInSeconds,
        }
    }
}
