import { ipcMain, app, BrowserWindow, dialog } from 'electron'
import log from 'electron-log'
import { writeFileSync } from 'fs'
import { timerService } from '../timer/timerService'
import { getSettings, saveSettings } from '../storage/settingsStore'
import { setAutoStart } from '../app/autoStart'
import {
  addRecord,
  getTodayStats,
  getWeekStats,
  getPomodoroRecords,
  getRecordsByDateRange
} from '../storage/sessionStore'
import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getUpdateStatus,
  openReleasePage
} from '../update/updateService'

/**
 * 统一注册所有 IPC 通道
 */
export function registerIpc(): void {
  // ─── Timer IPC ──────────────────────────────

  ipcMain.handle('timer:start', () => timerService.start())
  ipcMain.handle('timer:pause', () => timerService.pause())
  ipcMain.handle('timer:resume', () => timerService.resume())
  ipcMain.handle('timer:reset', () => timerService.reset())
  ipcMain.handle('timer:skip', () => timerService.skip())
  ipcMain.handle('timer:get-state', () => timerService.getState())

  // ─── Settings IPC ───────────────────────────

  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:save', (_event, settings) => {
    log.info('Settings saved')
    saveSettings(settings)
    // 开机自启设置联动
    if (settings && typeof settings.autoStartOnBoot === 'boolean') {
      setAutoStart(settings.autoStartOnBoot)
    }
  })

  // ─── Session / Stats IPC ────────────────────

  ipcMain.handle('session:add-record', (_event, data) => {
    addRecord(data)
  })

  ipcMain.handle('stats:today', () => getTodayStats())

  ipcMain.handle('stats:week', () => getWeekStats())

  ipcMain.handle('stats:records', (_event, limit?: number, offset?: number) => {
    return getPomodoroRecords(limit ?? 50, offset ?? 0)
  })

  ipcMain.handle('stats:records-by-date', (_event, startDate: string, endDate: string) => {
    return getRecordsByDateRange(startDate, endDate)
  })

  ipcMain.handle('stats:export', async (_event, format: 'csv' | 'json', records: unknown[]) => {
    const ext = format === 'csv' ? 'csv' : 'json'
    const filters = format === 'csv'
      ? [{ name: 'CSV Files', extensions: ['csv'] }]
      : [{ name: 'JSON Files', extensions: ['json'] }]

    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showSaveDialog(win ?? BrowserWindow.getAllWindows()[0], {
      title: `导出 ${format.toUpperCase()}`,
      defaultPath: `eye-timer-records.${ext}`,
      filters
    })

    if (result.canceled || !result.filePath) return { saved: false }

    try {
      let content: string
      if (format === 'csv') {
        const header = 'startTime,endTime,duration,actualDuration,completed,type'
        const rows = records.map((r: Record<string, unknown>) =>
          [r.startTime, r.endTime, r.duration, r.actualDuration, r.completed, r.type].join(',')
        )
        content = [header, ...rows].join('\n')
      } else {
        content = JSON.stringify(records, null, 2)
      }

      writeFileSync(result.filePath, content, 'utf-8')
      log.info(`Records exported: ${result.filePath} (${records.length} records)`)
      return { saved: true, path: result.filePath }
    } catch (e) {
      log.error('Export failed:', e)
      return { saved: false, error: String(e) }
    }
  })

  // ─── Update IPC ─────────────────────────────

  ipcMain.handle('update:check', () => checkForUpdates())

  ipcMain.handle('update:download', () => downloadUpdate())

  ipcMain.handle('update:install', () => installUpdate())

  ipcMain.handle('update:get-status', () => getUpdateStatus())

  ipcMain.handle('update:open-releases', () => openReleasePage())

  // ─── App IPC ────────────────────────────────

  ipcMain.handle('app:get-version', () => app.getVersion())

  ipcMain.handle('system:minimize-to-tray', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.hide()
      log.info('Window hidden to tray')
    }
  })

  log.info('IPC handlers registered')
}
