import { powerMonitor } from 'electron'
import log from 'electron-log'
import { timerService } from '../timer/timerService'
import { PhaseState } from '../timer/timerState'

let wasRunningBeforeSuspend = false

/**
 * 注册睡眠唤醒监听
 *
 * - 系统进入睡眠（suspend）→ 如果计时器正在运行，暂停
 * - 系统唤醒（resume）→ 如果之前在运行，自动恢复
 *
 * 这样用户合上笔记本盖子/系统休眠后，计时器不会继续走字。
 */
export function registerPowerMonitor(): void {
  powerMonitor.on('suspend', () => {
    const state = timerService.getState()
    const isActive =
      state.phase === PhaseState.WORKING ||
      state.phase === PhaseState.SHORT_BREAK ||
      state.phase === PhaseState.LONG_BREAK

    wasRunningBeforeSuspend = isActive

    if (isActive) {
      timerService.pause()
      log.info('Timer paused: system entering sleep')
    }
  })

  powerMonitor.on('resume', () => {
    if (wasRunningBeforeSuspend) {
      // 等一小段时间让系统完全唤醒后再恢复
      setTimeout(() => {
        timerService.resume()
        log.info('Timer resumed: system woke up')
        wasRunningBeforeSuspend = false
      }, 1000)
    }
  })

  powerMonitor.on('shutdown', () => {
    log.info('System shutdown detected')
  })

  log.info('Power monitor registered')
}
