import { useEffect, useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Download } from 'lucide-react'

interface TodayStats {
  completedCount: number
  totalMinutes: number
  totalBreakMinutes: number
  currentStreak: number
}

interface DayStats {
  date: string
  count: number
  minutes: number
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function formatWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const idx = (d.getDay() + 6) % 7 // Mon=0
  return WEEKDAY_LABELS[idx]
}

export default function StatsPage() {
  const [today, setToday] = useState<TodayStats>({ completedCount: 0, totalMinutes: 0, totalBreakMinutes: 0, currentStreak: 0 })
  const [week, setWeek] = useState<DayStats[]>([])
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      const [todayData, weekData] = await Promise.all([
        window.api.statsToday(),
        window.api.statsWeek()
      ])
      setToday(todayData)
      setWeek(weekData)
    } catch (e) {
      console.error('Failed to load stats:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const weekTotal = week.reduce((s, d) => s + d.minutes, 0)
  const weekCount = week.reduce((s, d) => s + d.count, 0)

  const chartData = week.map((d) => ({
    ...d,
    label: formatWeekday(d.date),
    hours: Number((d.minutes / 60).toFixed(1))
  }))

  const hasData = weekCount > 0

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const records = await window.api.statsRecords(500, 0)
      await window.api.statsExport(format, records)
    } catch (e) {
      console.error('Export failed:', e)
    }
  }

  if (loading) {
    return (
      <div className="page stats-page">
        <h2>专注统计</h2>
        <div className="stats-empty">加载中...</div>
      </div>
    )
  }

  return (
    <div className="page stats-page">
      <h2>专注统计</h2>

      {/* 今日数据 */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{today.completedCount}</div>
          <div className="stat-label">今日专注</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{today.totalMinutes < 60 ? `${today.totalMinutes}m` : `${(today.totalMinutes / 60).toFixed(1)}h`}</div>
          <div className="stat-label">今日时长</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{today.currentStreak}</div>
          <div className="stat-label">连续天数</div>
        </div>
      </div>

      {/* 本周概览 */}
      <div className="stats-week-summary">
        <span>本周共 {weekCount} 个番茄 · {weekTotal < 60 ? `${weekTotal} 分钟` : `${(weekTotal / 60).toFixed(1)} 小时`}</span>
      </div>

      {/* 周柱状图 */}
      {hasData ? (
        <div className="stats-chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3b5a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#a0a0b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#a0a0b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#2a2b4a', border: '1px solid #3a3b5a', borderRadius: 8, color: '#e8e8f0', fontSize: 13 }}
                formatter={(value: number, name: string) => name === 'hours' ? [`${value} 小时`, '专注时长'] : [value, name]}
                labelFormatter={(label) => `周${label}`}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? '#6c8cff' : '#4a6ab8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="stats-empty">还没有专注记录，开始你的第一个番茄吧！</div>
      )}

      {/* 导出按钮 */}
      <div className="stats-export">
        <button className="btn-export" onClick={() => handleExport('csv')}>
          <Download size={14} /> 导出 CSV
        </button>
        <button className="btn-export" onClick={() => handleExport('json')}>
          <Download size={14} /> 导出 JSON
        </button>
      </div>
    </div>
  )
}
