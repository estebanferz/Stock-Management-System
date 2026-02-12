import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT!;
const accessKeyId = process.env.S3_ACCESS_KEY_ID!;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!;
const region = process.env.S3_REGION ?? "auto";

export const S3_BUCKET = process.env.S3_BUCKET!;

if (!endpoint || !accessKeyId || !secretAccessKey || !S3_BUCKET) {
  throw new Error("Missing S3 env vars (S3_ENDPOINT/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY/S3_BUCKET)");
}

export const s3 = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
  // clave para S3-compatible (Railway Bucket)
  forcePathStyle: true,
});

export async function presignPut(params: {
  key: string;
  contentType: string;
  expiresInSec?: number;
}) {
  const cmd = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: params.expiresInSec ?? 60 * 5 });
  return url;
}

export async function presignGet(params: {
  key: string;
  expiresInSec?: number;
  responseContentDisposition?: string;
}) {
  const cmd = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: params.key,
    ResponseContentDisposition: params.responseContentDisposition,
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: params.expiresInSec ?? 60 * 10 });
  return url;
}
