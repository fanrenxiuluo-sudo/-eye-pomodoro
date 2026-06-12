/// <reference types="vite/client" />

interface Window {
  api: {
    // Timer
    timerStart: () => Promise<void>
    timerPause: () => Promise<void>
    timerResume: () => Promise<void>
    timerReset: () => Promise<void>
    timerSkip: () => Promise<boolean>
    timerGetState: () => Promise<{
      phase: string
      remaining: number
      total: number
      pomodorosCompleted: number
      forcedBreak: boolean
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
        forcedBreak: boolean
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
      downloading: boolean
      downloaded: boolean
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
        downloading: boolean
        downloaded: boolean
        error: string | null
      }) => void
    ) => () => void

    // Alert
    onAlertShow: (
      callback: (data: { type: 'work-end' | 'break-end'; message: string; tip: string }) => void
    ) => () => void
  }
}
