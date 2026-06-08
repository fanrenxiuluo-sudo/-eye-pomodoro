import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerCrashHandler } from './app/crashHandler'
import { requestSingleInstanceLock } from './app/singleInstance'
import { registerPowerMonitor } from './app/powerMonitor'
import { setAutoStart } from './app/autoStart'
import { registerIpc } from './ipc/registerIpc'
import { timerService } from './timer/timerService'
import { initDatabase, saveDb } from './storage/database'
import { initSettings, getSettings } from './storage/settingsStore'
import { addRecord } from './storage/sessionStore'
import { createTray, destroyTray } from './tray/trayManager'
import { initNotificationService } from './notification/notificationService'
import { initOverlayManager, destroyAllOverlays } from './overlay/overlayManager'
import { registerOverlayIpc } from './overlay/overlayIpc'
import type { PhaseEndData } from './timer/timerService'

// 扩展 app 类型，标记退出状态
declare module 'electron' {
  interface App {
    isQuitting: boolean
  }
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 600,
    minHeight: 450,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // ─── 关闭窗口 → 最小化到托盘（而非退出） ───
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
      log.info('Window closed → hidden to tray')
    }
    // app.isQuitting=true 时正常关闭，交给 before-quit 处理
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * 阶段结束回调：将番茄/休息记录写入 SQLite
 */
function handlePhaseEnd(data: PhaseEndData): void {
  addRecord({
    startTime: data.startTime,
    endTime: data.endTime,
    duration: data.plannedSec,
    actualDuration: data.actualSec,
    completed: data.completed,
    type: data.type
  })
  log.info(`Record saved: ${data.type} (${data.actualSec}s, completed=${data.completed})`)
}

// ─── 应用启动 ─────────────────────────────────

// 单实例锁（必须在 app.ready 之前）
if (!requestSingleInstanceLock()) {
  // 已有实例在运行，requestSingleInstanceLock 内部已调用 app.quit()
  // 直接退出
} else {
  app.whenReady().then(async () => {
    log.info('App starting...')

    // 1. 初始化标记
    app.isQuitting = false

    // 2. AppUserModelID（Windows 通知图标）
    electronApp.setAppUserModelId('com.eyecare.pomodoro')

    // 3. 崩溃兜底
    registerCrashHandler()

    // 4. 设置持久化（electron-store）
    await initSettings()

    // 5. 数据库（sql.js）
    await initDatabase()

    // 6. IPC 通道
    registerIpc()
    registerOverlayIpc()

    // 7. 阶段结束 → 写入记录
    timerService.onPhaseEnd(handlePhaseEnd)

    // 8. 恢复计时器
    timerService.init()

    // 9. 睡眠唤醒处理
    registerPowerMonitor()

    // 10. 通知与声音服务
    initNotificationService()

    // 11. 全屏休息遮罩（多显示器 + 热插拔）
    initOverlayManager()

    // 12. 开机自启
    const currentSettings = getSettings()
    setAutoStart(!!currentSettings.autoStartOnBoot)

    // 12. 窗口快捷键
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // 13. 创建主窗口
    createWindow()

    // 14. 系统托盘
    if (mainWindow) {
      createTray(mainWindow)
    }

    // 15. macOS dock 点击
    app.on('activate', () => {
      if (mainWindow) {
        mainWindow.show()
      } else {
        createWindow()
      }
    })

    log.info('App ready')
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    log.info('App quitting...')
    app.isQuitting = true
    destroyAllOverlays()
    destroyTray()
    saveDb()
  })
}
