import { useEffect, useState, useCallback, useRef } from 'react'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'

const PHASE_LABELS: Record<string, string> = {
  idle: '准备开始',
  working: '专注中',
  'paused-working': '已暂停',
  'short-break': '短休息',
  'paused-short-break': '休息暂停',
  'long-break': '长休息',
  'paused-long-break': '休息暂停'
}

const PHASE_RING_COLORS: Record<string, string> = {
  working: 'var(--accent)',
  'paused-working': 'var(--accent-muted)',
  'short-break': 'var(--success)',
  'paused-short-break': 'var(--success-muted)',
  'long-break': 'var(--info)',
  'paused-long-break': 'var(--info-muted)'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function TimerPage() {
  const [phase, setPhase] = useState('idle')
  const [remaining, setRemaining] = useState(0)
  const [total, setTotal] = useState(25 * 60)
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)
  const cleanupRef = useRef<(() => void)[]>([])

  // 监听 IPC 事件，组件卸载时清理
  useEffect(() => {
    const unsubTick = window.api.onTimerTick((data) => {
      setRemaining(data.remaining)
      setTotal(data.total)
      setPhase(data.phase)
    })

    const unsubState = window.api.onTimerStateChange((data) => {
      setPhase(data.phase)
      setRemaining(data.remaining)
      setTotal(data.total)
      setPomodorosCompleted(data.pomodorosCompleted)
    })

    cleanupRef.current = [unsubTick, unsubState]

    // 获取初始状态
    window.api.timerGetState().then((state) => {
      setPhase(state.phase)
      setRemaining(state.remaining)
      setTotal(state.total)
      setPomodorosCompleted(state.pomodorosCompleted)
    })

    return () => {
      cleanupRef.current.forEach((fn) => fn())
    }
  }, [])

  const handleStart = useCallback(() => {
    if (phase === 'idle') {
      window.api.timerStart()
    } else if (phase.includes('paused')) {
      window.api.timerResume()
    } else if (
      phase === 'working' ||
      phase === 'short-break' ||
      phase === 'long-break'
    ) {
      window.api.timerPause()
    }
  }, [phase])

  const handleReset = useCallback(() => {
    window.api.timerReset()
  }, [])

  const handleSkip = useCallback(() => {
    window.api.timerSkip()
  }, [])

  // SVG 圆环参数
  const radius = 90
  const circumference = 2 * Math.PI * radius // ≈ 565.48
  const progress = total > 0 ? remaining / total : 0
  const dashoffset = circumference * (1 - progress)

  const isRunning = phase === 'working' || phase === 'short-break' || phase === 'long-break'
  const isPaused = phase.includes('paused')
  const isIdle = phase === 'idle'

  const ringColor = PHASE_RING_COLORS[phase] || 'var(--accent)'

  // 按钮图标：暂停中 → Play; 运行中 → Pause; 空闲 → Play
  const ControlIcon = isRunning ? Pause : Play

  return (
    <div className="page timer-page">
      <div className="timer-status">{PHASE_LABELS[phase] || phase}</div>

      <div className="timer-display">
        <svg className="timer-ring" viewBox="0 0 200 200">
          <circle className="timer-ring-bg" cx="100" cy="100" r={radius} />
          <circle
            className="timer-ring-progress"
            cx="100"
            cy="100"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ stroke: ringColor }}
          />
        </svg>
        <div className="timer-time">{formatTime(remaining)}</div>
      </div>

      <div className="pomodoro-counter">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`pomodoro-dot ${i <= pomodorosCompleted ? 'completed' : ''}`} />
        ))}
      </div>

      <div className="timer-controls">
        <button
          className="btn-icon"
          title="重置"
          onClick={handleReset}
          disabled={isIdle}
        >
          <RotateCcw size={20} />
        </button>
        <button
          className="btn-primary"
          title={isRunning ? '暂停' : '开始'}
          onClick={handleStart}
        >
          <ControlIcon size={24} />
        </button>
        <button
          className="btn-icon"
          title="跳过"
          onClick={handleSkip}
          disabled={isIdle}
        >
          <SkipForward size={20} />
        </button>
      </div>
    </div>
  )
}
