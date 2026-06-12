import { ipcMain } from 'electron'
import log from 'electron-log'
import { timerService } from '../timer/timerService'
import { getSettings } from '../storage/settingsStore'

/**
 * 注册遮罩窗口 IPC 通道
 */
export function registerOverlayIpc(): void {
  ipcMain.handle('overlay:skip', () => {
    const settings = getSettings()
    if (settings.forcedBreak) {
      log.warn('Overlay skip blocked: forced break is enabled')
      return false
    }
    log.info('Overlay skip requested')
    timerService.skip()
    return true
  })

  // 紧急退出是唯一绕过强制休息的方式（3 秒长按 Esc）
  ipcMain.handle('overlay:emergency-exit', () => {
    log.warn('Emergency exit triggered (3s Esc hold)')
    timerService.emergencySkip()
    return true
  })
}
