import { Notification, BrowserWindow } from 'electron'
import log from 'electron-log'
import { timerService, type PhaseEndData } from '../timer/timerService'
import { PhaseState } from '../timer/timerState'
import { getSettings } from '../storage/settingsStore'
import { playWorkStart, playBreakStart, playBreakEnd } from '../utils/soundManager'
import { getRandomTip, formatTipBody, getBreakType } from '../eyecare/tipData'
import type { TimerStateData } from '../timer/timerTypes'

/**
 * 通知与声音服务
 *
 * 监听计时器事件，在合适的时机弹出系统通知、播放提示音、触发视觉特效。
 *
 * v0.3.0 增强：
 * - 任务栏闪烁（flashFrame）持续到用户点击
 * - 向渲染进程发送 alert 事件，显示醒目模态对话框
 * - 系统通知附带护眼提示摘要
 * - 强制聚焦窗口
 */

let previousPhase: PhaseState = PhaseState.IDLE

/**
 * 获取主窗口（非销毁状态）
 */
function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    if (!win.isDestroyed()) {
      return win
    }
  }
  return null
}

/**
 * 如果窗口被隐藏，强制显示并聚焦
 * v0.3.0: 同时触发任务栏闪烁，持续提醒用户
 */
function forceShowWindow(): void {
  const win = getMainWindow()
  if (win) {
    // 任务栏闪烁：持续闪烁直到用户点击窗口
    if (!win.isFocused()) {
      win.flashFrame(true)
      log.info('Taskbar flashing started')
    }
    if (!win.isVisible()) {
      win.show()
    }
    win.focus()
    win.moveTop()
    log.info('Phase ended: force-showing + flashing window')
  }
}

/**
 * 向渲染进程发送醒目提醒事件（显示模态对话框）
 */
function sendAlertToRenderer(type: 'work-end' | 'break-end', message: string, tip: string): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('alert:show', { type, message, tip })
    log.info(`Alert sent to renderer: ${type}`)
  }
}

/**
 * 初始化通知和声音服务
 */
export function initNotificationService(): void {
  // ─── 阶段结束 → 播放提示音 + 强制显示窗口 + 发送醒目提醒 ───
  timerService.onPhaseEnd((data: PhaseEndData) => {
    const settings = getSettings()

    // 无论设置如何，阶段结束时强制显示窗口 + 任务栏闪烁
    forceShowWindow()

    // 向渲染进程发送醒目提醒（显示模态对话框 + 全屏闪烁特效）
    if (data.type === 'work') {
      // 工作结束 → 休息开始
      const breakType = getBreakType(
        timerService.getState().pomodorosCompleted,
        settings.pomodorosBeforeLongBreak
      )
      const tip = getRandomTip(breakType)
      sendAlertToRenderer('work-end', `专注完成！休息 ${breakType === 'long' ? settings.longBreakDuration : settings.shortBreakDuration} 分钟`, formatTipBody(tip))
    } else {
      // 休息结束 → 工作开始
      sendAlertToRenderer('break-end', `休息结束，准备开始专注 ${settings.workDuration} 分钟`, '')
    }

    if (!settings.soundEnabled) return

    if (data.type === 'work') {
      playBreakStart() // 工作结束 → 播放"休息开始"提示音
    } else {
      playBreakEnd() // 休息结束 → 播放"休息结束"提示音
    }
  })

  // ─── 状态变更 → 弹出系统通知 ───
  timerService.onStateChange((state: TimerStateData) => {
    const currentPhase = state.phase as PhaseState
    const settings = getSettings()

    if (!settings.notificationEnabled) {
      previousPhase = currentPhase
      return
    }

    // 仅在阶段变化时通知（避免重复）
    if (currentPhase === previousPhase) {
      previousPhase = currentPhase
      return
    }

    const notifyWorkStart = () => {
      showNotification('🍅 开始专注', `专注 ${settings.workDuration} 分钟，加油！`, 'work-start')
    }

    const notifyBreakStart = () => {
      const breakType = getBreakType(state.pomodorosCompleted, settings.pomodorosBeforeLongBreak)
      const tip = getRandomTip(breakType)
      const breakDuration = breakType === 'long' ? settings.longBreakDuration : settings.shortBreakDuration
      showNotification(
        '⏰ 专注结束！该休息了',
        `已完成 ${state.pomodorosCompleted} 个番茄 → 休息 ${breakDuration} 分钟\n💡 ${tip.title}: ${tip.content.slice(0, 40)}...`,
        'break-start'
      )
    }

    switch (currentPhase) {
      case PhaseState.WORKING:
        if (previousPhase === PhaseState.IDLE || previousPhase.toString().includes('break')) {
          notifyWorkStart()
        }
        break
      case PhaseState.SHORT_BREAK:
      case PhaseState.LONG_BREAK:
        notifyBreakStart()
        break
    }

    previousPhase = currentPhase
  })

  log.info('Notification service initialized')
}

/**
 * 显示 Windows 系统通知
 * silent: false 让系统播放通知声音，双重提醒用户
 */
function showNotification(title: string, body: string, type: string): void {
  try {
    const notification = new Notification({
      title,
      body,
      silent: false, // 允许系统通知声音，确保用户注意到
      timeoutType: 'default'
    })

    notification.on('show', () => {
      log.debug(`Notification shown: ${type}`)
    })

    notification.on('click', () => {
      // 点击通知 → 显示主窗口
      const win = getMainWindow()
      if (win) {
        win.show()
        win.focus()
      }
    })

    notification.show()
  } catch (e) {
    log.error('Failed to show notification:', e)
  }
}
