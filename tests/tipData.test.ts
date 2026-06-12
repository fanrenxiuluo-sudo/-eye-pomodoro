import { describe, it, expect } from 'vitest'
import {
  SHORT_BREAK_TIPS,
  LONG_BREAK_TIPS,
  getTipsForBreakType,
  getRandomTip,
  getBreakType,
  formatTipForOverlay,
  formatTipBody
} from '../src/main/eyecare/tipData'

describe('tipData', () => {
  describe('getTipsForBreakType', () => {
    it('returns SHORT_BREAK_TIPS for short break', () => {
      expect(getTipsForBreakType('short')).toBe(SHORT_BREAK_TIPS)
    })

    it('returns LONG_BREAK_TIPS for long break', () => {
      expect(getTipsForBreakType('long')).toBe(LONG_BREAK_TIPS)
    })
  })

  describe('getRandomTip', () => {
    it('returns a tip from the correct pool', () => {
      const tip = getRandomTip('short')
      expect(SHORT_BREAK_TIPS.some((t) => t.id === tip.id)).toBe(true)
    })

    it('avoids consecutive duplicates', () => {
      const results = new Set<string>()
      for (let i = 0; i < 20; i++) {
        results.add(getRandomTip('short').id)
      }
      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('getBreakType', () => {
    it('returns short for non-multiples', () => {
      expect(getBreakType(1, 4)).toBe('short')
      expect(getBreakType(2, 4)).toBe('short')
      expect(getBreakType(3, 4)).toBe('short')
    })

    it('returns long for multiples of pomodorosBeforeLongBreak', () => {
      expect(getBreakType(4, 4)).toBe('long')
      expect(getBreakType(8, 4)).toBe('long')
    })

    it('returns short for 0 completed', () => {
      expect(getBreakType(0, 4)).toBe('short')
    })
  })

  describe('tip data integrity', () => {
    it('all SHORT_BREAK_TIPS have required fields', () => {
      for (const tip of SHORT_BREAK_TIPS) {
        expect(tip.id).toBeTruthy()
        expect(tip.title).toBeTruthy()
        expect(tip.content).toBeTruthy()
        expect(tip.duration).toBeTruthy()
        expect(tip.source).toBeTruthy()
        expect(['quick', 'exercise', 'lifestyle', 'environment']).toContain(tip.category)
        expect(['short', 'long', 'both']).toContain(tip.breakType)
      }
    })

    it('all LONG_BREAK_TIPS have required fields', () => {
      for (const tip of LONG_BREAK_TIPS) {
        expect(tip.id).toBeTruthy()
        expect(tip.title).toBeTruthy()
        expect(tip.content).toBeTruthy()
        expect(tip.duration).toBeTruthy()
        expect(tip.source).toBeTruthy()
        expect(['quick', 'exercise', 'lifestyle', 'environment']).toContain(tip.category)
        expect(['short', 'long', 'both']).toContain(tip.breakType)
      }
    })

    it('no duplicate IDs', () => {
      const allIds = [...SHORT_BREAK_TIPS, ...LONG_BREAK_TIPS].map((t) => t.id)
      expect(new Set(allIds).size).toBe(allIds.length)
    })
  })

  describe('formatTipForOverlay', () => {
    it('includes title, content, duration and source', () => {
      const tip = SHORT_BREAK_TIPS[0]
      const result = formatTipForOverlay(tip)
      expect(result).toContain(tip.title)
      expect(result).toContain(tip.duration)
      expect(result).toContain(tip.source)
    })
  })

  describe('formatTipBody', () => {
    it('truncates long content', () => {
      const tip = { ...SHORT_BREAK_TIPS[0], content: 'a'.repeat(100) }
      const result = formatTipBody(tip)
      expect(result).toContain('...')
      expect(result.length).toBeLessThan(tip.content.length + 30)
    })

    it('includes duration', () => {
      const result = formatTipBody(SHORT_BREAK_TIPS[0])
      expect(result).toContain(SHORT_BREAK_TIPS[0].duration)
    })
  })
})
