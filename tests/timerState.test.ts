import { describe, it, expect } from 'vitest'
import {
  PhaseState,
  canTransition,
  getNextPhase,
  getPhaseTotal
} from '../src/main/timer/timerState'
import { DEFAULT_SETTINGS } from '../src/shared/types'
import type { Settings } from '../src/shared/types'

const settings: Settings = { ...DEFAULT_SETTINGS }

describe('PhaseState transitions', () => {
  it('IDLE can only transition to WORKING', () => {
    expect(canTransition(PhaseState.IDLE, PhaseState.WORKING)).toBe(true)
    expect(canTransition(PhaseState.IDLE, PhaseState.SHORT_BREAK)).toBe(false)
    expect(canTransition(PhaseState.IDLE, PhaseState.LONG_BREAK)).toBe(false)
  })

  it('WORKING can transition to PAUSED_WORKING, SHORT_BREAK, LONG_BREAK', () => {
    expect(canTransition(PhaseState.WORKING, PhaseState.PAUSED_WORKING)).toBe(true)
    expect(canTransition(PhaseState.WORKING, PhaseState.SHORT_BREAK)).toBe(true)
    expect(canTransition(PhaseState.WORKING, PhaseState.LONG_BREAK)).toBe(true)
    expect(canTransition(PhaseState.WORKING, PhaseState.IDLE)).toBe(false)
  })

  it('PAUSED_WORKING can resume or reset', () => {
    expect(canTransition(PhaseState.PAUSED_WORKING, PhaseState.WORKING)).toBe(true)
    expect(canTransition(PhaseState.PAUSED_WORKING, PhaseState.IDLE)).toBe(true)
  })

  it('break states can pause and resume', () => {
    expect(canTransition(PhaseState.SHORT_BREAK, PhaseState.PAUSED_SHORT_BREAK)).toBe(true)
    expect(canTransition(PhaseState.PAUSED_SHORT_BREAK, PhaseState.SHORT_BREAK)).toBe(true)
    expect(canTransition(PhaseState.LONG_BREAK, PhaseState.PAUSED_LONG_BREAK)).toBe(true)
    expect(canTransition(PhaseState.PAUSED_LONG_BREAK, PhaseState.LONG_BREAK)).toBe(true)
  })
})

describe('getNextPhase', () => {
  it('after WORKING → SHORT_BREAK (not yet enough for long break)', () => {
    expect(getNextPhase(PhaseState.WORKING, 1, settings)).toBe(PhaseState.SHORT_BREAK)
    expect(getNextPhase(PhaseState.WORKING, 2, settings)).toBe(PhaseState.SHORT_BREAK)
    expect(getNextPhase(PhaseState.WORKING, 3, settings)).toBe(PhaseState.SHORT_BREAK)
  })

  it('after WORKING → LONG_BREAK when pomodorosCompleted is multiple of pomodorosBeforeLongBreak', () => {
    expect(getNextPhase(PhaseState.WORKING, 4, settings)).toBe(PhaseState.LONG_BREAK)
    expect(getNextPhase(PhaseState.WORKING, 8, settings)).toBe(PhaseState.LONG_BREAK)
  })

  it('after SHORT_BREAK → WORKING', () => {
    expect(getNextPhase(PhaseState.SHORT_BREAK, 1, settings)).toBe(PhaseState.WORKING)
  })

  it('after LONG_BREAK → WORKING', () => {
    expect(getNextPhase(PhaseState.LONG_BREAK, 4, settings)).toBe(PhaseState.WORKING)
  })

  it('respects custom pomodorosBeforeLongBreak', () => {
    const custom = { ...settings, pomodorosBeforeLongBreak: 2 }
    expect(getNextPhase(PhaseState.WORKING, 2, custom)).toBe(PhaseState.LONG_BREAK)
    expect(getNextPhase(PhaseState.WORKING, 3, custom)).toBe(PhaseState.SHORT_BREAK)
    expect(getNextPhase(PhaseState.WORKING, 4, custom)).toBe(PhaseState.LONG_BREAK)
  })
})

describe('getPhaseTotal', () => {
  it('returns correct seconds for each phase', () => {
    expect(getPhaseTotal(PhaseState.WORKING, settings)).toBe(25 * 60)
    expect(getPhaseTotal(PhaseState.SHORT_BREAK, settings)).toBe(5 * 60)
    expect(getPhaseTotal(PhaseState.LONG_BREAK, settings)).toBe(15 * 60)
  })

  it('returns 0 for IDLE and paused states', () => {
    expect(getPhaseTotal(PhaseState.IDLE, settings)).toBe(0)
    expect(getPhaseTotal(PhaseState.PAUSED_WORKING, settings)).toBe(0)
  })

  it('uses custom durations', () => {
    const custom = { ...settings, workDuration: 50, shortBreakDuration: 10, longBreakDuration: 30 }
    expect(getPhaseTotal(PhaseState.WORKING, custom)).toBe(50 * 60)
    expect(getPhaseTotal(PhaseState.SHORT_BREAK, custom)).toBe(10 * 60)
    expect(getPhaseTotal(PhaseState.LONG_BREAK, custom)).toBe(30 * 60)
  })
})
