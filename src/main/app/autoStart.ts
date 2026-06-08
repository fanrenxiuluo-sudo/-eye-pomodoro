import { app } from 'electron'
import log from 'electron-log'

/**
 * 开机自启管理
 *
 * 使用 Electron 内置 app.setLoginItemSettings() 写入 Windows 注册表。
 * 无需 auto-launch npm 包。
 */
export function setAutoStart(enabled: boolean): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
      args: ['--auto-started'] // 标记参数，可用于区分手动启动和自启
    })
    log.info(`Auto-start ${enabled ? 'enabled' : 'disabled'}`)
  } catch (e) {
    log.error('Failed to set auto-start:', e)
  }
}

/**
 * 获取当前自启状态
 */
export function getAutoStart(): boolean {
  try {
    const settings = app.getLoginItemSettings()
    return settings.openAtLogin
  } catch {
    return false
  }
}
