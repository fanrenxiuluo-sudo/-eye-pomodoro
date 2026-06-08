import { app, BrowserWindow } from 'electron'
import log from 'electron-log'

/**
 * 单实例锁
 *
 * 保证同一时间只有一个应用实例在运行。
 * 重复启动时，已有实例的窗口会被聚焦。
 *
 * @returns true 表示当前实例获得锁（继续启动），false 表示已有实例在运行（退出）
 */
export function requestSingleInstanceLock(): boolean {
  const gotLock = app.requestSingleInstanceLock()

  if (!gotLock) {
    log.info('Another instance is already running, quitting')
    app.quit()
    return false
  }

  // 重复启动时，聚焦已有窗口
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    log.info('Second instance attempted, focusing existing window')

    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        if (win.isMinimized()) win.restore()
        win.show()
        win.focus()
      }
    }
  })

  log.info('Single instance lock acquired')
  return true
}
