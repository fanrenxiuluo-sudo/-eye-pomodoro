import { Notification, BrowserWindow } from 'electron'
import log from 'electron-log'
import { timerService, type PhaseEndData } from '../timer/timerService'
import { PhaseState } from '../timer/timerState'
import { getSettings } from '../storage/settingsStore'
import { playWorkStart, playBreakStart, playBreakEnd } from '../utils/soundManager'
import type { TimerStateData } from '../timer/timerTypes'

/**
 * 通知与声音服务
 *
 * 监听计时器事件，在合适的时机弹出系统通知和播放提示音。
 *
 * 触发逻辑：
 * - 声音：在 onPhaseEnd 回调中触发（阶段刚结束时），重复3次
 * - 通知：在 onStateChange 回调中触发（新阶段刚开始时）
 * - 窗口：如果窗口隐藏，阶段结束时强制显示窗口
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
 */
function forceShowWindow(): void {
  const win = getMainWindow()
  if (win && !win.isVisible()) {
    win.show()
    win.focus()
    log.info('Phase ended: force-showing hidden window')
  }
}

/**
 * 初始化通知和声音服务
 */
export function initNotificationService(): void {
  // ─── 阶段结束 → 播放提示音 + 强制显示窗口 ───
  timerService.onPhaseEnd((data: PhaseEndData) => {
    const settings = getSettings()

    // 无论设置如何，阶段结束时如果窗口隐藏都强制显示
    forceShowWindow()

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
      showNotification(
        '☕ 该休息了',
        `已完成 ${state.pomodorosCompleted} 个番茄，休息一下吧`,
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
