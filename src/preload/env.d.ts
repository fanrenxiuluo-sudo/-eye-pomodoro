/// <reference types="vite/client" />

interface Window {
  electron: typeof import('@electron-toolkit/preload').electronAPI
  api: {
    // Timer
    timerStart: () => Promise<void>
    timerPause: () => Promise<void>
    timerResume: () => Promise<void>
    timerReset: () => Promise<void>
    timerSkip: () => Promise<void>
    timerGetState: () => Promise<{
      phase: string
      remaining: number
      total: number
      pomodorosCompleted: number
    }>
    onTimerTick: (
      callback: (data: { remaining: number; total: number; phase: string }) => void
    ) => () => void
    onTimerStateChange: (
      callback: (data: {
        phase: string
        remaining: number
        total: number
        pomodorosCompleted: number
      }) => void
    ) => () => void

    // Settings
    settingsGet: () => Promise<Record<string, unknown>>
    settingsSave: (settings: Record<string, unknown>) => Promise<void>

    // Session / Stats
    sessionAddRecord: (data: Record<string, unknown>) => Promise<void>
    statsToday: () => Promise<{
      completedCount: number
      totalMinutes: number
      totalBreakMinutes: number
      currentStreak: number
    }>
    statsWeek: () => Promise<{ date: string; count: number; minutes: number }[]>
    statsRecords: (
      limit?: number,
      offset?: number
    ) => Promise<
      {
        id: string
        startTime: string
        endTime: string
        duration: number
        actualDuration: number
        completed: boolean
        type: string
      }[]
    >
    statsExport: (
      format: 'csv' | 'json',
      records: unknown[]
    ) => Promise<{ saved: boolean; path?: string }>

    // System
    minimizeToTray: () => Promise<void>
    getVersion: () => Promise<string>

    // Update
    updateCheck: () => Promise<void>
    updateDownload: () => Promise<void>
    updateInstall: () => Promise<void>
    updateGetStatus: () => Promise<{
      checking: boolean
      available: boolean
      currentVersion: string
      latestVersion: string | null
      downloadProgress: number
      error: string | null
    }>
    updateOpenReleases: () => Promise<void>
    onUpdateStatus: (
      callback: (data: {
        checking: boolean
        available: boolean
        currentVersion: string
        latestVersion: string | null
        downloadProgress: number
        error: string | null
      }) => void
    ) => () => void
  }
}
