import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { timerService } from '../timer/timerService'
import { PhaseState } from '../timer/timerState'
import { getSettings } from '../storage/settingsStore'

let tray: Tray | null = null
let updateTimer: ReturnType<typeof setInterval> | null = null

const STATUS_LABELS: Record<string, string> = {
  [PhaseState.IDLE]: '待命',
  [PhaseState.WORKING]: '专注中',
  [PhaseState.PAUSED_WORKING]: '专注暂停',
  [PhaseState.SHORT_BREAK]: '短休息',
  [PhaseState.PAUSED_SHORT_BREAK]: '休息暂停',
  [PhaseState.LONG_BREAK]: '长休息',
  [PhaseState.PAUSED_LONG_BREAK]: '休息暂停'
}

/**
 * 创建托盘图标并初始化所有行为
 */
export function createTray(mainWindow: BrowserWindow): void {
  const iconPath = join(__dirname, '../../resources/icon.ico')
  const icon = nativeImage.createFromPath(iconPath)

  tray = new Tray(icon)
  tray.setToolTip('EyeTimer 护眼番茄钟')

  updateContextMenu(mainWindow)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // 监听状态变更 → 更新菜单
  timerService.onPhaseEnd(() => updateContextMenu(mainWindow))
  timerService.onStateChange(() => updateContextMenu(mainWindow))

  // 每秒更新 tooltip
  updateTimer = setInterval(() => {
    if (tray && !tray.isDestroyed()) {
      updateTooltip()
      updateContextMenu(mainWindow)
    }
  }, 1000)

  mainWindow.on('closed', () => {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
  })

  log.info('Tray created')
}

export function destroyTray(): void {
  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }
  if (tray && !tray.isDestroyed()) {
    tray.destroy()
    tray = null
  }
}

function updateTooltip(): void {
  if (!tray || tray.isDestroyed()) return

  const state = timerService.getState()
  const label = STATUS_LABELS[state.phase] || state.phase

  if (state.phase === PhaseState.IDLE) {
    tray.setToolTip(`EyeTimer — ${label}　🍅 今日 ${state.pomodorosCompleted} 个`)
  } else {
    const min = Math.floor(state.remaining / 60)
    const sec = state.remaining % 60
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    tray.setToolTip(`EyeTimer — ${label} ${timeStr}　🍅 ×${state.pomodorosCompleted}`)
  }
}

function updateContextMenu(mainWindow: BrowserWindow): void {
  if (!tray || tray.isDestroyed()) return

  const state = timerService.getState()
  const settings = getSettings()
  const label = STATUS_LABELS[state.phase] || state.phase
  const isRunning =
    state.phase === PhaseState.WORKING ||
    state.phase === PhaseState.SHORT_BREAK ||
    state.phase === PhaseState.LONG_BREAK
  const isPaused = state.phase.toString().includes('paused')
  const isBreak =
    state.phase === PhaseState.SHORT_BREAK || state.phase === PhaseState.LONG_BREAK

  let timeStr = ''
  if (state.remaining > 0) {
    const min = Math.floor(state.remaining / 60)
    const sec = state.remaining % 60
    timeStr = ` (${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')})`
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    { label: ` EyeTimer 护眼番茄钟`, enabled: false },
    { type: 'separator' },
    { label: `状态：${label}${timeStr}`, enabled: false },
    {
      label: '显示主窗口',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    { type: 'separator' },
    {
      label: isRunning ? '⏸ 暂停' : '▶ 开始',
      enabled: state.phase !== PhaseState.IDLE || !isRunning,
      click: () => {
        if (state.phase === PhaseState.IDLE) {
          timerService.start()
        } else if (isRunning) {
          timerService.pause()
        } else if (isPaused) {
          timerService.resume()
        }
      }
    },
    {
      label: '⏹ 重置',
      click: () => timerService.reset()
    }
  ]

  // 强制休息模式 → 显示"紧急退出"选项
  if (isBreak && settings.forcedBreak) {
    template.push({ type: 'separator' })
    template.push({
      label: '🚨 紧急退出休息',
      click: () => {
        log.warn('Emergency exit from tray')
        timerService.skip()
      }
    })
  }

  template.push(
    { type: 'separator' },
    {
      label: '⚙ 设置',
      click: () => {
        mainWindow.show()
        mainWindow.webContents.send('navigate-to', 'settings')
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        log.info('User clicked exit from tray')
        app.isQuitting = true
        app.quit()
      }
    }
  )

  tray.setContextMenu(Menu.buildFromTemplate(template))
}
