import mongoose from 'mongoose'
import LearningSession from '../models/LearningSession.js'

function getTodayDate() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

// POST /learning-sessions/track
export const trackActiveTime = async (req, res) => {
  try {
    const { activeSeconds } = req.body
    const userId = req.user._id

    if (typeof activeSeconds !== "number" || activeSeconds <= 0) {
      return res.status(400).json({ message: "activeSeconds must be a positive number" })
    }

    const date = getTodayDateVN() // 🔥 string, không phải Date

    const session = await LearningSession.findOneAndUpdate(
      { userId, date },
      { $inc: { activeSeconds } },
      { upsert: true, new: true }
    )

    res.json({
      date: session.date,
      activeSeconds: session.activeSeconds
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

//GET /learning-sessions/activity?days=90&userId=xxx
export const getActivityChart = async (req, res) => {
  try {
    const { userId, days = 30 } = req.query

    if (!userId) {
      return res.status(400).json({ message: "userId is required" })
    }

    const start = new Date()
    start.setDate(start.getDate() - days)

    const startStr = start.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    })

    const data = await LearningSession.find({
      userId,
      date: { $gte: startStr }, // 🔥 so sánh string
    }).sort({ date: -1 })

    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

//helper
function getTodayDateVN() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  })
}
