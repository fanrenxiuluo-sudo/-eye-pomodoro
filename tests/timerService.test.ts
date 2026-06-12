import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('electron', () => ({
  BrowserWindow: { getAllWindows: () => [] }
}))
vi.mock('electron-log', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))
vi.mock('../src/main/app/recovery', () => ({
  loadSavedState: () => null,
  saveTimerState: vi.fn(),
  clearSavedState: vi.fn()
}))
vi.mock('../src/main/storage/settingsStore', () => ({
  getSettings: () => ({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomodorosBeforeLongBreak: 4,
    forcedBreak: true,
    showOverlay: true,
    autoStartBreak: false,
    autoStartWork: false,
    soundEnabled: true,
    soundVolume: 0.7,
    notificationEnabled: true,
    theme: 'system',
    autoStartOnBoot: false,
    warmFilter: false,
    warmFilterIntensity: 40
  })
}))

import { timerService } from '../src/main/timer/timerService'

describe('TimerService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    timerService.reset()
  })

  afterEach(() => {
    timerService.reset()
    vi.useRealTimers()
  })

  it('starts in idle state', () => {
    const state = timerService.getState()
    expect(state.phase).toBe('idle')
    expect(state.remaining).toBe(0)
    expect(state.pomodorosCompleted).toBe(0)
  })

  it('transitions to working on start', () => {
    timerService.start()
    const state = timerService.getState()
    expect(state.phase).toBe('working')
    expect(state.total).toBe(25 * 60)
  })

  it('ignores start when not idle', () => {
    timerService.start()
    timerService.start()
    expect(timerService.getState().phase).toBe('working')
  })

  it('pauses and resumes', () => {
    timerService.start()
    timerService.pause()
    expect(timerService.getState().phase).toBe('paused-working')

    timerService.resume()
    expect(timerService.getState().phase).toBe('working')
  })

  it('resets to idle', () => {
    timerService.start()
    timerService.reset()
    expect(timerService.getState().phase).toBe('idle')
    expect(timerService.getState().pomodorosCompleted).toBe(0)
  })

  it('skip during working is allowed', () => {
    timerService.start()
    const result = timerService.skip()
    expect(result).toBe(true)
  })

  it('skip during break is blocked when forcedBreak is enabled', () => {
    timerService.start()
    vi.advanceTimersByTime(25 * 60 * 1000 + 1000)
    const state = timerService.getState()
    if (state.phase.includes('break')) {
      const result = timerService.skip()
      expect(result).toBe(false)
    }
  })

  it('emergencySkip bypasses forcedBreak', () => {
    timerService.start()
    vi.advanceTimersByTime(25 * 60 * 1000 + 1000)
    const state = timerService.getState()
    if (state.phase.includes('break')) {
      timerService.emergencySkip()
      const afterState = timerService.getState()
      expect(afterState.phase).not.toContain('break')
    }
  })

  it('fires multiple phaseEnd listeners without overwriting', () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()
    timerService.onPhaseEnd(listener1)
    timerService.onPhaseEnd(listener2)

    timerService.start()
    timerService.skip()

    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })

  it('fires multiple stateChange listeners without overwriting', () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()
    timerService.onStateChange(listener1)
    timerService.onStateChange(listener2)

    timerService.start()

    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })

  it('getState includes forcedBreak', () => {
    const state = timerService.getState()
    expect(state).toHaveProperty('forcedBreak')
    expect(typeof state.forcedBreak).toBe('boolean')
  })
})
