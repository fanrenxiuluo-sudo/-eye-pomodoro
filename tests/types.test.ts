import { describe, it, expect } from 'vitest'
import { DEFAULT_SETTINGS } from '../src/shared/types'
import type { Settings } from '../src/shared/types'

describe('DEFAULT_SETTINGS', () => {
  it('has all required fields', () => {
    const required: (keyof Settings)[] = [
      'workDuration',
      'shortBreakDuration',
      'longBreakDuration',
      'pomodorosBeforeLongBreak',
      'forcedBreak',
      'showOverlay',
      'autoStartBreak',
      'autoStartWork',
      'soundEnabled',
      'soundVolume',
      'notificationEnabled',
      'theme',
      'autoStartOnBoot',
      'warmFilter',
      'warmFilterIntensity'
    ]
    for (const key of required) {
      expect(DEFAULT_SETTINGS).toHaveProperty(key)
    }
  })

  it('has sensible defaults', () => {
    expect(DEFAULT_SETTINGS.workDuration).toBe(25)
    expect(DEFAULT_SETTINGS.shortBreakDuration).toBe(5)
    expect(DEFAULT_SETTINGS.longBreakDuration).toBe(15)
    expect(DEFAULT_SETTINGS.pomodorosBeforeLongBreak).toBe(4)
    expect(DEFAULT_SETTINGS.forcedBreak).toBe(true)
    expect(DEFAULT_SETTINGS.showOverlay).toBe(true)
    expect(DEFAULT_SETTINGS.warmFilter).toBe(false)
    expect(DEFAULT_SETTINGS.warmFilterIntensity).toBeGreaterThan(0)
    expect(DEFAULT_SETTINGS.warmFilterIntensity).toBeLessThanOrEqual(100)
  })

  it('theme is valid', () => {
    expect(['light', 'dark', 'system']).toContain(DEFAULT_SETTINGS.theme)
  })

  it('soundVolume is between 0 and 1', () => {
    expect(DEFAULT_SETTINGS.soundVolume).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_SETTINGS.soundVolume).toBeLessThanOrEqual(1)
  })
})
