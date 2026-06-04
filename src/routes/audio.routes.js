import { Router } from 'express'
import multer from 'multer'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3, BUCKET, buildAudioKey } from '../config/storage.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Upload audio cho 1 sentence
// POST /api/audio/upload
// body: { topicSlug, lessonSlug, sentenceIndex (optional) }
// file: audio file
router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const { topicSlug, lessonSlug, sentenceIndex } = req.body
    const key = buildAudioKey({ topicSlug, lessonSlug, sentenceIndex })

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || 'audio/mpeg',
    }))

    const url = `${process.env.MINIO_ENDPOINT}/${BUCKET}/${key}`
    res.json({ url, key })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Xoá audio
// DELETE /api/audio?key=topics/...
router.delete('/', async (req, res) => {
  try {
    const { key } = req.query
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    res.json({ deleted: key })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router