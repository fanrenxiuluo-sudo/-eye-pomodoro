import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // ─── Timer ───────────────────────────────────
  timerStart: () => ipcRenderer.invoke('timer:start'),
  timerPause: () => ipcRenderer.invoke('timer:pause'),
  timerResume: () => ipcRenderer.invoke('timer:resume'),
  timerReset: () => ipcRenderer.invoke('timer:reset'),
  timerSkip: () => ipcRenderer.invoke('timer:skip'),
  timerGetState: () =>
    ipcRenderer.invoke('timer:get-state') as Promise<{
      phase: string
      remaining: number
      total: number
      pomodorosCompleted: number
    }>,

  onTimerTick: (callback: (data: { remaining: number; total: number; phase: string }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: unknown): void =>
      callback(data as { remaining: number; total: number; phase: string })
    ipcRenderer.on('timer:tick', listener)
    return () => {
      ipcRenderer.removeListener('timer:tick', listener)
    }
  },

  onTimerStateChange: (
    callback: (data: { phase: string; remaining: number; total: number; pomodorosCompleted: number }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: unknown
    ): void =>
      callback(
        data as { phase: string; remaining: number; total: number; pomodorosCompleted: number }
      )
    ipcRenderer.on('timer:state-change', listener)
    return () => {
      ipcRenderer.removeListener('timer:state-change', listener)
    }
  },

  // ─── Settings ────────────────────────────────
  settingsGet: () => ipcRenderer.invoke('settings:get') as Promise<Record<string, unknown>>,
  settingsSave: (settings: Record<string, unknown>) => ipcRenderer.invoke('settings:save', settings),

  // ─── Session / Stats ─────────────────────────
  sessionAddRecord: (data: Record<string, unknown>) => ipcRenderer.invoke('session:add-record', data),
  statsToday: () =>
    ipcRenderer.invoke('stats:today') as Promise<{
      completedCount: number
      totalMinutes: number
      totalBreakMinutes: number
      currentStreak: number
    }>,
  statsWeek: () =>
    ipcRenderer.invoke('stats:week') as Promise<
      { date: string; count: number; minutes: number }[]
    >,
  statsRecords: (limit?: number, offset?: number) =>
    ipcRenderer.invoke('stats:records', limit, offset) as Promise<
      {
        id: string
        startTime: string
        endTime: string
        duration: number
        actualDuration: number
        completed: boolean
        type: string
      }[]
    >,
  statsExport: (format: 'csv' | 'json', records: unknown[]) =>
    ipcRenderer.invoke('stats:export', format, records) as Promise<{ saved: boolean; path?: string }>,

  // ─── System ──────────────────────────────────
  minimizeToTray: () => ipcRenderer.invoke('system:minimize-to-tray'),
  getVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
