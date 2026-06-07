import { randomUUID } from 'crypto'
import { getDb, debouncedSave } from './database'
import type { SessionType } from '../../shared/types'

/**
 * 会话记录存储
 *
 * 负责番茄/休息记录的写入和查询统计。
 * 所有方法直接操作 SQLite（sql.js）。
 */

// ─── 写入 ─────────────────────────────────────

export interface RecordInsertData {
  startTime: string // ISO
  endTime: string // ISO
  duration: number // 计划秒数
  actualDuration: number // 实际秒数
  completed: boolean
  type: SessionType
}

/** 添加一条记录（番茄或休息通用） */
export function addRecord(data: RecordInsertData): void {
  const db = getDb()
  const id = randomUUID()
  const table = data.type === 'work' ? 'pomodoro_records' : 'break_records'

  db.run(
    `INSERT INTO ${table} (id, startTime, endTime, duration, actualDuration, completed, type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.startTime,
      data.endTime,
      Math.round(data.duration),
      Math.round(data.actualDuration),
      data.completed ? 1 : 0,
      data.type
    ]
  )

  debouncedSave()
}

// ─── 查询：今日统计 ───────────────────────────

export interface TodayStats {
  completedCount: number // 今日完成番茄数
  totalMinutes: number // 今日总专注分钟
  totalBreakMinutes: number // 今日总休息分钟
  currentStreak: number // 当前连续天数（含今天）
}

/** 获取今天的日期字符串（本地时区） */
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getTodayStats(): TodayStats {
  const db = getDb()
  const today = todayStr()

  // 今日番茄
  const workResult = db.exec(
    `SELECT COUNT(*) as cnt, COALESCE(SUM(actualDuration), 0) as total
     FROM pomodoro_records
     WHERE startTime >= ? AND startTime < date(?, '+1 day') AND completed = 1`,
    [today, today]
  )
  const workRow = workResult[0]?.values[0]
  const completedCount = (workRow?.[0] as number) ?? 0
  const totalSeconds = (workRow?.[1] as number) ?? 0
  const totalMinutes = Math.round(totalSeconds / 60)

  // 今日休息
  const breakResult = db.exec(
    `SELECT COALESCE(SUM(actualDuration), 0) as total
     FROM break_records
     WHERE startTime >= ? AND startTime < date(?, '+1 day') AND completed = 1`,
    [today, today]
  )
  const breakRow = breakResult[0]?.values[0]
  const breakSeconds = (breakRow?.[0] as number) ?? 0
  const totalBreakMinutes = Math.round(breakSeconds / 60)

  // 连续天数（含今天）
  const currentStreak = calculateStreak()

  return { completedCount, totalMinutes, totalBreakMinutes, currentStreak }
}

/** 计算连续天数 */
function calculateStreak(): number {
  const db = getDb()
  let streak = 0
  const d = new Date()

  while (true) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const result = db.exec(
      `SELECT COUNT(*) FROM pomodoro_records
       WHERE startTime >= ? AND startTime < date(?, '+1 day') AND completed = 1`,
      [dateStr, dateStr]
    )
    const count = (result[0]?.values[0]?.[0] as number) ?? 0
    if (count === 0) break

    streak++
    d.setDate(d.getDate() - 1)
  }

  return streak
}

// ─── 查询：本周统计 ───────────────────────────

export interface DayStats {
  date: string // YYYY-MM-DD
  count: number
  minutes: number
}

export function getWeekStats(): DayStats[] {
  const db = getDb()
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ...
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)) // 本周一
  monday.setHours(0, 0, 0, 0)

  const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`

  const result = db.exec(
    `SELECT date(startTime) as day, COUNT(*) as cnt, COALESCE(SUM(actualDuration), 0) as total
     FROM pomodoro_records
     WHERE startTime >= ? AND completed = 1
     GROUP BY day ORDER BY day`,
    [mondayStr]
  )

  // 填充 7 天（周一到周日），缺失的天数为 0
  const weekMap = new Map<string, DayStats>()
  if (result[0]) {
    for (const row of result[0].values) {
      weekMap.set(row[0] as string, {
        date: row[0] as string,
        count: row[1] as number,
        minutes: Math.round((row[2] as number) / 60)
      })
    }
  }

  const stats: DayStats[] = []
  const d = new Date(monday)
  for (let i = 0; i < 7; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    stats.push(weekMap.get(key) ?? { date: key, count: 0, minutes: 0 })
    d.setDate(d.getDate() + 1)
  }

  return stats
}

// ─── 查询：记录列表 ───────────────────────────

export interface RecordRow {
  id: string
  startTime: string
  endTime: string
  duration: number
  actualDuration: number
  completed: boolean
  type: SessionType
}

/** 获取指定数量的番茄记录（倒序） */
export function getPomodoroRecords(limit: number = 50, offset: number = 0): RecordRow[] {
  const db = getDb()
  const result = db.exec(
    `SELECT id, startTime, endTime, duration, actualDuration, completed, type
     FROM pomodoro_records
     ORDER BY startTime DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  )

  if (!result[0]) return []
  return result[0].values.map((row) => ({
    id: row[0] as string,
    startTime: row[1] as string,
    endTime: row[2] as string,
    duration: row[3] as number,
    actualDuration: row[4] as number,
    completed: (row[5] as number) === 1,
    type: row[6] as SessionType
  }))
}

/** 获取指定日期范围的番茄记录 */
export function getRecordsByDateRange(
  startDate: string,
  endDate: string
): RecordRow[] {
  const db = getDb()
  const result = db.exec(
    `SELECT id, startTime, endTime, duration, actualDuration, completed, type
     FROM pomodoro_records
     WHERE startTime >= ? AND startTime < date(?, '+1 day')
     ORDER BY startTime DESC`,
    [startDate, endDate]
  )

  if (!result[0]) return []
  return result[0].values.map((row) => ({
    id: row[0] as string,
    startTime: row[1] as string,
    endTime: row[2] as string,
    duration: row[3] as number,
    actualDuration: row[4] as number,
    completed: (row[5] as number) === 1,
    type: row[6] as SessionType
  }))
}
