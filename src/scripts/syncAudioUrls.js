import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import Sentence from '../models/Sentence.js'
import Lesson from '../models/Lesson.js'
import LessonGroup from '../models/LessonGroup.js'
import Topic from '../models/Topic.js'

dotenv.config()

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.MINIO_BUCKET || 'daily-dictation'
const BASE_URL = `${process.env.MINIO_ENDPOINT}/${BUCKET}`

await mongoose.connect(process.env.MONGO_URI)
console.log('✅ Connected to MongoDB')

// 1. Lấy tất cả sentence, populate lesson → group → topic
const sentences = await Sentence.find({})
  .populate({
    path: 'lessonId',
    populate: {
      path: 'groupId',
      populate: { path: 'topicId' }
    }
  })

console.log(`📦 Tìm thấy ${sentences.length} sentences`)

let updated = 0
let notFound = 0

for (const sentence of sentences) {
  const lesson = sentence.lessonId
  if (!lesson) continue

  const group = lesson.groupId
  const topic = group?.topicId

  if (!topic || !group || !lesson) continue

  const topicSlug = topic.slug
  const lessonSlug = lesson.slug
  const order = sentence.order

  // Ghép URL theo đúng cấu trúc MinIO của bạn
  const key = `topics/${topicSlug}/${lessonSlug}/sentences/${order}.mp3`
  const url = `${BASE_URL}/${key}`

  // Kiểm tra file có tồn tại trong MinIO không
  try {
    const result = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: key,
      MaxKeys: 1,
    }))

    // Kiểm tra có tìm thấy file không
    if (!result.Contents || result.Contents.length === 0) {
      console.log(`❌ không tìm thấy: ${key}`)
      notFound++
      continue  // ← bỏ qua, không update MongoDB
    }

    await Sentence.findByIdAndUpdate(sentence._id, { audioUrl: url })
    console.log(`✅ ${key}`)
    updated++
  } catch (err) {
    console.log(`❌ lỗi: ${key} — ${err.message}`)
    notFound++
  }
}
await mongoose.disconnect()