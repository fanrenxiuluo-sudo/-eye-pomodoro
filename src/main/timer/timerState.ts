import type { Settings } from '../../shared/types'

/**
 * 计时器状态机——所有可能的状态
 *
 * idle → working → paused-working → short-break / long-break
 *                → paused-short-break / paused-long-break
 */
export enum PhaseState {
  IDLE = 'idle',
  WORKING = 'working',
  PAUSED_WORKING = 'paused-working',
  SHORT_BREAK = 'short-break',
  PAUSED_SHORT_BREAK = 'paused-short-break',
  LONG_BREAK = 'long-break',
  PAUSED_LONG_BREAK = 'paused-long-break'
}

/**
 * 状态转换定义：每个状态 → 可转换到的目标状态列表
 */
export const TRANSITIONS: Partial<Record<PhaseState, PhaseState[]>> = {
  [PhaseState.IDLE]: [PhaseState.WORKING],
  [PhaseState.WORKING]: [PhaseState.PAUSED_WORKING, PhaseState.SHORT_BREAK, PhaseState.LONG_BREAK],
  [PhaseState.PAUSED_WORKING]: [PhaseState.WORKING, PhaseState.IDLE],
  [PhaseState.SHORT_BREAK]: [PhaseState.PAUSED_SHORT_BREAK, PhaseState.WORKING],
  [PhaseState.PAUSED_SHORT_BREAK]: [PhaseState.SHORT_BREAK, PhaseState.WORKING],
  [PhaseState.LONG_BREAK]: [PhaseState.PAUSED_LONG_BREAK, PhaseState.WORKING],
  [PhaseState.PAUSED_LONG_BREAK]: [PhaseState.LONG_BREAK, PhaseState.WORKING]
}

/**
 * 检查状态转换是否合法
 */
export function canTransition(from: PhaseState, to: PhaseState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * 计算当前阶段结束后，下一个阶段是什么
 *
 * @param current   当前结束的阶段
 * @param completed 已完成的番茄数
 * @param settings  用户设置
 * @returns 下一个阶段状态
 */
export function getNextPhase(
  current: PhaseState.WORKING | PhaseState.SHORT_BREAK | PhaseState.LONG_BREAK,
  completed: number,
  settings: Settings
): PhaseState {
  if (current === PhaseState.WORKING) {
    // 工作结束 → 判断是否该进入长休息
    if (completed > 0 && completed % settings.pomodorosBeforeLongBreak === 0) {
      return PhaseState.LONG_BREAK
    }
    return PhaseState.SHORT_BREAK
  }

  // 休息结束 → 回到工作
  return PhaseState.WORKING
}

/**
 * 获取某个阶段的总时长（秒）
 */
export function getPhaseTotal(phase: PhaseState, settings: Settings): number {
  switch (phase) {
    case PhaseState.WORKING:
      return settings.workDuration * 60
    case PhaseState.SHORT_BREAK:
      return settings.shortBreakDuration * 60
    case PhaseState.LONG_BREAK:
      return settings.longBreakDuration * 60
    default:
      return 0
  }
}
