import { Router } from 'express'
import fetch from 'node-fetch'
import User from '../models/User.js'
import Lesson from '../models/Lesson.js'
import Progress from '../models/Progress.js'
import Topic from '../models/Topic.js'

const router = Router()

// ── Helper: extract email từ context.user_url ──
const resolveUser = async (userString = '', context = {}) => {
  if (context?.user_url) {
    const match = context.user_url.match(/\/email\/(.+)$/)
    if (match) {
      const email = decodeURIComponent(match[1])
      return User.findOne({ email: email.trim().toLowerCase() })
    }
  }
  if (typeof userString === 'string' && userString.includes('@')) {
    return User.findOne({ email: userString.trim().toLowerCase() })
  }
  return null
}

// ── 1. GET /metadata ──
router.get('/metadata', (req, res) => {
  res.json({
    name: 'DailyDictation Assistant',
    description: 'Trợ lý luyện nghe tiếng Anh — tra từ, gợi ý bài, theo dõi tiến độ.',
    capabilities: ['lookup_word', 'suggest_lesson', 'check_progress'],
    status: 'active',
    supported_models: [{ model_id: 'default', name: 'Default' }],
    sample_prompts: [
      'Tôi đã hoàn thành bao nhiêu bài?',
      'Gợi ý bài học cho tôi',
      'Bài nào đang học dở?',
      'Streak của tôi là bao nhiêu?',
    ],
  })
})

// ── 2. POST /ask ──
router.post('/ask', async (req, res) => {
  console.log('[aiPortal] body:', JSON.stringify(req.body, null, 2))
  const { prompt = '', user: userString, context = {} } = req.body
  const text = prompt.toLowerCase().trim()

  try {
    const user = await resolveUser(userString, context)

    // Tra từ — xử lý hoàn toàn trong aiPortal
    if (
      text.includes('nghĩa là gì') ||
      text.includes('nghĩa của') ||
      text.includes('tra từ') ||
      text.includes('what does')
    ) {
      const word = prompt
        .replace(/nghĩa là gì|nghĩa của từ|nghĩa của|tra từ|what does|mean\??|\?/gi, '')
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 1)
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z']/g, '')

      console.log('[aiPortal] extracted word:', word)  // ← thêm dòng này
      console.log('[aiPortal] text:', text)

      try {
        const [dictRes, transRes] = await Promise.allSettled([
          fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`),
          fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|vi`)
        ])

        // ── Đọc JSON 1 lần ──
        let dictData = null
        if (dictRes.status === 'fulfilled' && dictRes.value.ok) {
          dictData = await dictRes.value.json()  // chỉ .json() 1 lần
        }

        // IPA — dùng dictData
        let ukIpa = null, usIpa = null
        if (dictData) {
          const entry = dictData[0]
          const phonetics = entry?.phonetics || []
          ukIpa = phonetics.find(p => p.audio?.includes('-uk'))?.text || phonetics.find(p => p.text)?.text || entry?.phonetic
          usIpa = phonetics.find(p => p.audio?.includes('-us'))?.text || phonetics.find(p => !p.audio?.includes('-uk') && p.text)?.text || entry?.phonetic
        }

        // Translation
        let translation = null
        if (transRes.status === 'fulfilled' && transRes.value.ok) {
          const data = await transRes.value.json()
          if (data.responseStatus === 200) translation = data.responseData.translatedText
        }

        // Meanings — dùng lại dictData (không fetch lại)
        let meaningsText = ''
        if (dictData) {
          const meanings = dictData[0]?.meanings || []
          meaningsText = meanings.map(m => {
            const defs = m.definitions.slice(0, 3).map((d, i) => {
              const example = d.example ? `\n  > *"${d.example}"*` : ''
              return `${i + 1}. ${d.definition}${example}`
            }).join('\n')
            return `**_${m.partOfSpeech}_**\n${defs}`
          }).join('\n\n')
        }

        if (!meaningsText) {
          return res.json({
            status: 'success',
            content_markdown: `Không tìm thấy từ **${word}** trong từ điển.`,
          })
        }

        return res.json({
          status: 'success',
          content_markdown:
            `## 📖 ${word}\n\n` +
            `🇬🇧 \`${ukIpa || 'N/A'}\` · 🇺🇸 \`${usIpa || 'N/A'}\`\n` +
            `🇻🇳 **${translation || 'N/A'}**\n\n` +
            `---\n\n` +
            meaningsText,
        })
      } catch (err) {
        return res.json({
          status: 'success',
          content_markdown: `Lỗi tra từ: ${err.message}`,
        })
      }
    }

    // Tiến độ tổng quan
    if (text.includes('tiến độ') || text.includes('bao nhiêu bài') || text.includes('hoàn thành')) {
      if (!user) return res.json(needLogin())
      const [completed, inProgress, total] = await Promise.all([
        Progress.countDocuments({ userId: user._id, status: 'completed' }),
        Progress.countDocuments({ userId: user._id, status: 'in-progress' }),
        Lesson.countDocuments(),
      ])
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0
      return res.json({
        status: 'success',
        content_markdown:
          `## Tiến độ học của **${user.username}** 📊\n\n` +
          `| | Số bài |\n|---|---|\n` +
          `| ✅ Hoàn thành | **${completed}** |\n` +
          `| ▶️ Đang học | **${inProgress}** |\n` +
          `| 📚 Tổng số bài | **${total}** |\n\n` +
          `> Bạn đã hoàn thành **${percent}%** tổng số bài học.`,
      })
    }

    // Bài đang dở
    if (text.includes('dở dang') || text.includes('đang học') || text.includes('chưa xong')) {
      if (!user) return res.json(needLogin())
      const list = await Progress.find({ userId: user._id, status: 'in-progress' })
        .populate('lessonId', 'title slug')
        .limit(5)
      if (list.length === 0) {
        return res.json({
          status: 'success',
          content_markdown: `Bạn không có bài nào đang dở dang. Hãy bắt đầu bài mới nhé! 🎯`,
        })
      }
      const lines = list.map((p) => `- **${p.lessonId?.title}** — câu ${p.currentSentence + 1}`).join('\n')
      return res.json({
        status: 'success',
        content_markdown: `## Bài đang học dở 📖\n\n${lines}`,
      })
    }

    // Gợi ý bài học
    if (text.includes('gợi ý') || text.includes('nên học') || text.includes('bài nào')) {
      if (!user) {
        const starters = await Lesson.find().limit(3).select('title slug')
        const lines = starters.map((l) => `- **${l.title}**`).join('\n')
        return res.json({
          status: 'success',
          content_markdown: `## Gợi ý bài học 🌱\n\n${lines}\n\n> Đăng nhập để nhận gợi ý cá nhân hoá.`,
        })
      }
      const completedIds = (
        await Progress.find({ userId: user._id, status: 'completed' }).select('lessonId')
      ).map((p) => String(p.lessonId))
      const suggested = await Lesson.find({ _id: { $nin: completedIds } }).limit(3).select('title slug')
      if (suggested.length === 0) {
        return res.json({
          status: 'success',
          content_markdown: `🎉 Bạn đã hoàn thành tất cả bài học có sẵn!`,
        })
      }
      const lines = suggested.map((l) => `- **${l.title}**`).join('\n')
      return res.json({
        status: 'success',
        content_markdown: `## Gợi ý bài tiếp theo 🎯\n\n${lines}`,
      })
    }

    // Streak / thống kê
    if (text.includes('streak') || text.includes('thống kê') || text.includes('chuỗi')) {
      if (!user) return res.json(needLogin())
      return res.json({
        status: 'success',
        content_markdown:
          `## Thống kê của **${user.username}** 🏆\n\n` +
          `- 🔥 Streak: **${user.streak || 0} ngày**\n` +
          `- ⏱️ Tổng thời gian: **${user.totalMinutes || 0} phút**\n` +
          `- 📖 Tổng bài đã học: **${user.totalLessons || 0} bài**`,
      })
    }

    // Fallback
    return res.json({
      status: 'success',
      content_markdown:
        `Xin chào${user ? ` **${user.username}**` : ''}! Tôi là trợ lý **DailyDictation** 🎧\n\n` +
        `Tôi có thể giúp bạn:\n` +
        `- 📊 **Tiến độ học** — *"Tôi đã hoàn thành bao nhiêu bài?"*\n` +
        `- 📖 **Bài đang dở** — *"Bài nào đang học dở?"*\n` +
        `- 🎯 **Gợi ý bài** — *"Gợi ý bài học cho tôi"*\n` +
        `- 🏆 **Thống kê** — *"Streak của tôi là bao nhiêu?"*`,
    })
  } catch (err) {
    console.error('[aiPortal] error:', err)
    res.json({ status: 'success', content_markdown: `Lỗi: ${err.message}` })
  }
})

// ── 3. GET /data ──
router.get('/data', async (req, res) => {
  const { type = 'lessons', user_email } = req.query
  try {
    const user = user_email ? await User.findOne({ email: user_email.toLowerCase() }) : null

    if (type === 'lessons') {
      const lessons = await Lesson.find().limit(20).select('title slug')
      return res.json({ status: 'success', data_type: 'lessons', items: lessons })
    }
    if (type === 'progress' && user) {
      const progress = await Progress.find({ userId: user._id })
        .populate('lessonId', 'title')
        .limit(20)
      return res.json({ status: 'success', data_type: 'progress', items: progress })
    }
    if (type === 'topics') {
      const topics = await Topic.find().select('title slug')
      return res.json({ status: 'success', data_type: 'topics', items: topics })
    }
    res.json({ status: 'error', error_message: `Unsupported type: ${type}`, items: [] })
  } catch (err) {
    res.status(500).json({ status: 'error', error_message: err.message, items: [] })
  }
})

// ── Helper ──
const needLogin = () => ({
  status: 'success',
  content_markdown: `Bạn cần **đăng nhập DailyDictation** để xem thông tin này.`,
})

export default router