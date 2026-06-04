import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',          // MinIO bỏ qua region nhưng SDK cần
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,          // BẮT BUỘC với MinIO
})

export const BUCKET = process.env.MINIO_BUCKET || 'daily-dictation'

// Tạo key theo thứ bậc
export function buildAudioKey({ topicSlug, lessonSlug, sentenceIndex }) {
  if (sentenceIndex !== undefined) {
    return `topics/${topicSlug}/${lessonSlug}/sentences/${sentenceIndex}.mp3`
  }
  return `topics/${topicSlug}/${lessonSlug}/0.mp3`
}