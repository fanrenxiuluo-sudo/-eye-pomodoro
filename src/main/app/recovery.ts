import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import log from 'electron-log'
import type { SavedTimerState } from '../timer/timerTypes'
import { PhaseState } from '../timer/timerState'

const SCHEMA_VERSION = 1

function getFilePath(): string {
  return join(app.getPath('userData'), 'timer-state.json')
}

/**
 * 加载上次保存的计时器状态
 */
export function loadSavedState(): SavedTimerState | null {
  const filePath = getFilePath()
  if (!existsSync(filePath)) return null

  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as SavedTimerState
    if (data.schemaVersion !== SCHEMA_VERSION) {
      log.warn('Timer state schema version mismatch, discarding')
      clearSavedState()
      return null
    }
    return data
  } catch (e) {
    log.error('Failed to load timer state:', e)
    clearSavedState()
    return null
  }
}

/**
 * 保存计时器状态到磁盘
 */
export function saveTimerState(
  phase: PhaseState,
  endTs: number | null,
  remainingSec: number,
  pomodorosCompleted: number
): void {
  const state: SavedTimerState = {
    schemaVersion: SCHEMA_VERSION,
    phase,
    endTs,
    remainingSec,
    pomodorosCompleted,
    savedAt: Date.now()
  }

  try {
    writeFileSync(getFilePath(), JSON.stringify(state), 'utf-8')
  } catch (e) {
    log.error('Failed to save timer state:', e)
  }
}

/**
 * 清除已保存的计时器状态（计时器正常结束或恢复完成后）
 */
export function clearSavedState(): void {
  const filePath = getFilePath()
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  } catch (e) {
    log.error('Failed to clear timer state:', e)
  }
}
