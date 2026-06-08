import { autoUpdater, UpdateInfo } from 'electron-updater'
import { BrowserWindow, dialog, shell } from 'electron'
import log from 'electron-log'

/**
 * 自动更新服务
 *
 * 使用 electron-updater 从 GitHub Releases 检查和下载更新。
 * 配置来自 electron-builder.yml 的 publish 字段。
 */

let mainWindow: BrowserWindow | null = null

export interface UpdateStatus {
  checking: boolean
  available: boolean
  currentVersion: string
  latestVersion: string | null
  downloadProgress: number
  error: string | null
}

let status: UpdateStatus = {
  checking: false,
  available: false,
  currentVersion: '',
  latestVersion: null,
  downloadProgress: 0,
  error: null
}

/**
 * 初始化自动更新服务
 */
export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win

  // 配置日志
  autoUpdater.logger = log

  // 不自动下载，由用户决定
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // 获取当前版本
  const { app } = require('electron')
  status.currentVersion = app.getVersion()

  // ─── 事件监听 ───

  autoUpdater.on('checking-for-update', () => {
    status.checking = true
    status.error = null
    sendStatus()
    log.info('Checking for updates...')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    status.checking = false
    status.available = true
    status.latestVersion = info.version
    sendStatus()
    log.info(`Update available: ${info.version}`)

    // 弹窗询问是否下载
    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: '发现新版本',
        message: `发现新版本 v${info.version}`,
        detail: `当前版本：v${status.currentVersion}\n\n是否立即下载更新？`,
        buttons: ['立即下载', '稍后再说'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-not-available', () => {
    status.checking = false
    status.available = false
    sendStatus()
    log.info('No updates available')

    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: '检查更新',
      message: '当前已是最新版本',
      detail: `当前版本：v${status.currentVersion}`,
      buttons: ['好的']
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    status.downloadProgress = Math.round(progress.percent)
    sendStatus()
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    status.available = true
    status.downloadProgress = 100
    status.latestVersion = info.version
    sendStatus()
    log.info(`Update downloaded: ${info.version}`)

    // 弹窗询问是否立即安装
    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: '更新下载完成',
        message: `新版本 v${info.version} 已下载完成`,
        detail: '点击"立即重启"安装更新，更新将在重启后生效。',
        buttons: ['立即重启', '稍后重启'],
        defaultId: 0,
        cancelId: 1
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (err) => {
    status.checking = false
    status.error = err.message
    sendStatus()
    log.error('Auto-updater error:', err)
  })

  log.info('Auto-updater initialized')
}

/**
 * 手动检查更新（供 IPC 调用）
 */
export function checkForUpdates(): void {
  if (!mainWindow) return
  autoUpdater.checkForUpdates().catch((err) => {
    log.error('Failed to check for updates:', err)
    status.error = err.message
    sendStatus()
  })
}

/**
 * 下载更新
 */
export function downloadUpdate(): void {
  autoUpdater.downloadUpdate().catch((err) => {
    log.error('Failed to download update:', err)
    status.error = err.message
    sendStatus()
  })
}

/**
 * 安装更新并重启
 */
export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}

/**
 * 获取当前状态
 */
export function getUpdateStatus(): UpdateStatus {
  return { ...status }
}

/**
 * 打开 GitHub Releases 页面（浏览器中查看）
 */
export function openReleasePage(): void {
  shell.openExternal('https://github.com/fanrenxiuluo-sudo/-eye-pomodoro/releases')
}

function sendStatus(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', status)
  }
}
