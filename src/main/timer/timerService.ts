import { BrowserWindow } from 'electron'
import log from 'electron-log'
import { PhaseState, getNextPhase, getPhaseTotal } from './timerState'
import type { TimerTickData, TimerStateData } from './timerTypes'
import { loadSavedState, saveTimerState, clearSavedState } from '../app/recovery'
import { getSettings } from '../storage/settingsStore'

/**
 * 阶段结束回调数据
 */
export interface PhaseEndData {
  type: 'work' | 'short-break' | 'long-break'
  startTime: string // ISO
  endTime: string // ISO
  plannedSec: number // 计划秒数
  actualSec: number // 实际秒数（可能被跳过/提前结束）
  completed: boolean // 是否完整完成（跳过 = false）
}

/**
 * 番茄钟核心服务
 *
 * 职责：
 * 1. 管理番茄钟状态机（idle → work → break → 循环）
 * 2. 使用 Date.now() 差值计时，避免 setInterval 漂移
 * 3. 每秒向所有窗口发送 tick 事件
 * 4. 状态变更时持久化到磁盘，用于异常恢复
 * 5. 启动时检查上次未完成的计时，自动恢复
 */
class TimerService {
  private phase: PhaseState = PhaseState.IDLE
  private endTs: number | null = null
  private remainingSec: number = 0
  private pomodorosCompleted: number = 0
  private tickTimer: ReturnType<typeof setInterval> | null = null
  private phaseStartTs: number = 0 // 当前阶段开始时间戳
  private phaseEndListeners: ((data: PhaseEndData) => void)[] = []
  private stateChangeListeners: ((state: TimerStateData) => void)[] = []

  /**
   * 初始化计时器。检查上次是否有未完成的计时。
   */
  init(): void {
    const saved = loadSavedState()
    if (!saved) {
      log.info('Timer initialized: no saved state')
      return
    }

    const savedPhase = saved.phase as PhaseState

    if (
      savedPhase === PhaseState.WORKING ||
      savedPhase === PhaseState.SHORT_BREAK ||
      savedPhase === PhaseState.LONG_BREAK
    ) {
      if (saved.endTs && saved.endTs > Date.now()) {
        this.phase = savedPhase
        this.endTs = saved.endTs
        this.remainingSec = 0
        this.pomodorosCompleted = saved.pomodorosCompleted
        // 恢复阶段开始时间 = endTs - 计划总时长
        this.phaseStartTs = saved.endTs - getPhaseTotal(savedPhase, getSettings()) * 1000
        this.startTick()
        log.info(
          `Timer recovered: ${savedPhase}, remaining ${Math.ceil((saved.endTs - Date.now()) / 1000)}s`
        )
      } else {
        log.info('Timer expired during absence, cleaning up')
        clearSavedState()
      }
    } else {
      clearSavedState()
    }
  }

  /** 注册阶段结束监听器（支持多个，不会互相覆盖） */
  onPhaseEnd(callback: (data: PhaseEndData) => void): void {
    this.phaseEndListeners.push(callback)
  }

  /** 注册状态变更监听器（支持多个，不会互相覆盖） */
  onStateChange(callback: (state: TimerStateData) => void): void {
    this.stateChangeListeners.push(callback)
  }

  // ─── IPC 操作 ───────────────────────────────

  start(): void {
    if (this.phase !== PhaseState.IDLE) {
      log.warn('Timer.start called but not idle')
      return
    }

    const settings = getSettings()
    this.pomodorosCompleted = 0
    this.phaseStartTs = Date.now()
    this.transitionTo(PhaseState.WORKING, getPhaseTotal(PhaseState.WORKING, settings))
    log.info('Timer started: work session')
  }

  pause(): void {
    if (!this.isActive(this.phase)) {
      log.warn('Timer.pause called but not active')
      return
    }

    this.remainingSec = this.getRemaining()
    this.endTs = null
    this.stopTick()

    const pausedMap: Partial<Record<PhaseState, PhaseState>> = {
      [PhaseState.WORKING]: PhaseState.PAUSED_WORKING,
      [PhaseState.SHORT_BREAK]: PhaseState.PAUSED_SHORT_BREAK,
      [PhaseState.LONG_BREAK]: PhaseState.PAUSED_LONG_BREAK
    }
    this.phase = pausedMap[this.phase] ?? this.phase

    this.emitStateChange()
    this.persist()
    log.info(`Timer paused at ${this.remainingSec}s`)
  }

  resume(): void {
    const resumeMap: Partial<Record<PhaseState, PhaseState>> = {
      [PhaseState.PAUSED_WORKING]: PhaseState.WORKING,
      [PhaseState.PAUSED_SHORT_BREAK]: PhaseState.SHORT_BREAK,
      [PhaseState.PAUSED_LONG_BREAK]: PhaseState.LONG_BREAK
    }

    const targetPhase = resumeMap[this.phase]
    if (!targetPhase) {
      log.warn('Timer.resume called but not paused')
      return
    }

    this.phase = targetPhase
    this.endTs = Date.now() + this.remainingSec * 1000
    this.remainingSec = 0
    this.startTick()

    this.emitStateChange()
    this.persist()
    log.info(`Timer resumed: ${this.phase}`)
  }

  reset(): void {
    this.stopTick()
    this.phase = PhaseState.IDLE
    this.endTs = null
    this.remainingSec = 0
    this.pomodorosCompleted = 0
    this.phaseStartTs = 0
    clearSavedState()

    this.emitStateChange()
    log.info('Timer reset')
  }

  skip(): boolean {
    if (this.phase === PhaseState.IDLE) return false

    const settings = getSettings()
    const isBreak =
      this.phase === PhaseState.SHORT_BREAK ||
      this.phase === PhaseState.LONG_BREAK ||
      this.phase === PhaseState.PAUSED_SHORT_BREAK ||
      this.phase === PhaseState.PAUSED_LONG_BREAK

    if (isBreak && settings.forcedBreak) {
      log.warn('Timer.skip blocked: forced break is enabled')
      return false
    }

    log.info(`Timer skip: ${this.phase}`)
    this.handlePhaseEnd(false)
    return true
  }

  /** 紧急跳过 — 绕过 forcedBreak 限制（仅供 3 秒 Esc 紧急退出使用） */
  emergencySkip(): void {
    if (this.phase === PhaseState.IDLE) return
    log.warn(`Timer emergency skip: ${this.phase}`)
    this.handlePhaseEnd(false)
  }

  getState(): TimerStateData {
    const settings = getSettings()
    return {
      phase: this.phase,
      remaining: this.getRemaining(),
      total: this.getPhaseTotalSec(),
      pomodorosCompleted: this.pomodorosCompleted,
      forcedBreak: settings.forcedBreak
    }
  }

  // ─── 内部逻辑 ───────────────────────────────

  private transitionTo(phase: PhaseState, totalSec: number): void {
    this.phase = phase
    this.endTs = totalSec > 0 ? Date.now() + totalSec * 1000 : null
    this.remainingSec = 0
    this.startTick()

    this.emitStateChange()
    this.persist()
  }

  /**
   * 当前阶段计时结束
   * @param completed true=完整完成, false=被跳过
   */
  private handlePhaseEnd(completed: boolean = true): void {
    const completedPhase = this.phase
    this.stopTick()

    const settings = getSettings()
    const plannedSec = getPhaseTotal(completedPhase, settings)
    const actualSec = Math.round((Date.now() - this.phaseStartTs) / 1000)

    if (completedPhase === PhaseState.WORKING) {
      this.pomodorosCompleted++
    }

    const phaseEndData: PhaseEndData | null =
      completedPhase === PhaseState.WORKING
        ? {
            type: 'work',
            startTime: new Date(this.phaseStartTs).toISOString(),
            endTime: new Date().toISOString(),
            plannedSec,
            actualSec,
            completed
          }
        : completedPhase === PhaseState.SHORT_BREAK ||
            completedPhase === PhaseState.LONG_BREAK
          ? {
              type: completedPhase as 'short-break' | 'long-break',
              startTime: new Date(this.phaseStartTs).toISOString(),
              endTime: new Date().toISOString(),
              plannedSec,
              actualSec,
              completed
            }
          : null

    if (phaseEndData) {
      for (const listener of this.phaseEndListeners) {
        try {
          listener(phaseEndData)
        } catch (e) {
          log.error('PhaseEnd listener error:', e)
        }
      }
    }

    const next = getNextPhase(
      completedPhase as PhaseState.WORKING | PhaseState.SHORT_BREAK | PhaseState.LONG_BREAK,
      this.pomodorosCompleted,
      settings
    )
    const total = getPhaseTotal(next, settings)

    const shouldAutoStart =
      (completedPhase === PhaseState.WORKING && settings.autoStartBreak) ||
      ((completedPhase === PhaseState.SHORT_BREAK || completedPhase === PhaseState.LONG_BREAK) &&
        settings.autoStartWork)

    if (shouldAutoStart) {
      this.phaseStartTs = Date.now()
      this.transitionTo(next, total)
      log.info(`Auto-started: ${next}`)
    } else {
      this.phase = PhaseState.IDLE
      this.endTs = null
      this.remainingSec = total
      this.phaseStartTs = 0
      this.emitStateChange()
      this.persist()
      log.info(`Phase ended: ${completedPhase}, waiting for user action`)
    }
  }

  // ─── 计时引擎 ───────────────────────────────

  private startTick(): void {
    this.stopTick()
    this.tickTimer = setInterval(() => this.tick(), 1000)
  }

  private stopTick(): void {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
  }

  private tick(): void {
    const remaining = this.getRemaining()

    if (remaining <= 0) {
      this.handlePhaseEnd(true)
      return
    }

    this.emitTick(remaining)

    if (remaining % 10 === 0) {
      this.persist()
    }
  }

  // ─── 时间计算 ───────────────────────────────

  private getRemaining(): number {
    if (this.phase === PhaseState.IDLE) return 0
    if (this.endTs === null) return this.remainingSec
    return Math.max(0, Math.ceil((this.endTs - Date.now()) / 1000))
  }

  private getPhaseTotalSec(): number {
    const settings = getSettings()
    return getPhaseTotal(this.phase, settings)
  }

  private isActive(phase: PhaseState): boolean {
    return (
      phase === PhaseState.WORKING ||
      phase === PhaseState.SHORT_BREAK ||
      phase === PhaseState.LONG_BREAK
    )
  }

  // ─── 事件发送 ───────────────────────────────

  private emitTick(remaining: number): void {
    const data: TimerTickData = {
      remaining,
      total: this.getPhaseTotalSec(),
      phase: this.phase,
      pomodorosCompleted: this.pomodorosCompleted
    }
    this.sendToAll('timer:tick', data)
  }

  private emitStateChange(): void {
    const state = this.getState()
    this.sendToAll('timer:state-change', state)
    for (const listener of this.stateChangeListeners) {
      try {
        listener(state)
      } catch (e) {
        log.error('StateChange listener error:', e)
      }
    }
  }

  private sendToAll(channel: string, data: unknown): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data)
      }
    }
  }

  // ─── 持久化 ─────────────────────────────────

  private persist(): void {
    saveTimerState(this.phase, this.endTs, this.remainingSec, this.pomodorosCompleted)
  }
}

export const timerService = new TimerService()
