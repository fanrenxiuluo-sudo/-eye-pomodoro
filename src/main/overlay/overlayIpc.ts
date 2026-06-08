import { ipcMain } from 'electron'
import log from 'electron-log'
import { timerService } from '../timer/timerService'

/**
 * 注册遮罩窗口 IPC 通道
 */
export function registerOverlayIpc(): void {
  // 跳过休息（非强制模式下可用）
  ipcMain.handle('overlay:skip', () => {
    log.info('Overlay skip requested')
    timerService.skip()
  })

  // 紧急退出（强制模式下 3 秒长按 Esc 触发）
  ipcMain.handle('overlay:emergency-exit', () => {
    log.warn('Emergency exit triggered (3s Esc hold)')
    timerService.skip()
  })
}
