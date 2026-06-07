export type TimerPhase = 'idle' | 'working' | 'short-break' | 'long-break'

export interface TimerState {
  phase: TimerPhase
  remaining: number // seconds
  total: number // total seconds for current phase
  pomodorosCompleted: number
}

export interface Settings {
  workDuration: number // minutes
  shortBreakDuration: number
  longBreakDuration: number
  pomodorosBeforeLongBreak: number
  forcedBreak: boolean
  showOverlay: boolean
  autoStartBreak: boolean
  autoStartWork: boolean
  soundEnabled: boolean
  soundVolume: number
  notificationEnabled: boolean
  theme: 'light' | 'dark' | 'system'
  autoStartOnBoot: boolean
  [key: string]: unknown // electron-store 索引签名兼容
}

export const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosBeforeLongBreak: 4,
  forcedBreak: true,
  showOverlay: true,
  autoStartBreak: true,
  autoStartWork: false,
  soundEnabled: true,
  soundVolume: 0.7,
  notificationEnabled: true,
  theme: 'system',
  autoStartOnBoot: false
}

export type SessionType = 'work' | 'short-break' | 'long-break'

export interface PomodoroRecord {
  id: string
  startTime: string // ISO timestamp
  endTime: string
  duration: number // planned minutes
  actualDuration: number // actual minutes
  completed: boolean
  type: SessionType
}
