import { execFile } from 'child_process'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import log from 'electron-log'
import { generateMelody } from './wav'
import { getSettings } from '../storage/settingsStore'

// ─── 提示音定义 ───────────────────────────────
// 每个提示音是一组正弦波音符序列，频率单位 Hz

/** 工作开始：上升音调（C5→E5→G5），积极向上 */
const WORK_START_MELODY = [
  { frequency: 523, duration: 0.12 }, // C5
  { frequency: 659, duration: 0.12 }, // E5
  { frequency: 784, duration: 0.2 } // G5
]

/** 工作结束 / 休息开始：下降音调（G5→E5→C5），舒缓放松 */
const BREAK_START_MELODY = [
  { frequency: 784, duration: 0.12 }, // G5
  { frequency: 659, duration: 0.12 }, // E5
  { frequency: 523, duration: 0.2 } // C5
]

/** 休息结束：温暖的双音（C5→E5），提示回归工作 */
const BREAK_END_MELODY = [
  { frequency: 523, duration: 0.15 }, // C5
  { frequency: 659, duration: 0.25 } // E5
]

// ─── 缓存生成的 WAV Buffer ────────────────────

let workStartWav: Buffer | null = null
let breakStartWav: Buffer | null = null
let breakEndWav: Buffer | null = null

function getWorkStartWav(): Buffer {
  if (!workStartWav) {
    workStartWav = generateMelody(WORK_START_MELODY, 0.4)
  }
  return workStartWav
}

function getBreakStartWav(): Buffer {
  if (!breakStartWav) {
    breakStartWav = generateMelody(BREAK_START_MELODY, 0.35)
  }
  return breakStartWav
}

function getBreakEndWav(): Buffer {
  if (!breakEndWav) {
    breakEndWav = generateMelody(BREAK_END_MELODY, 0.35)
  }
  return breakEndWav
}

// ─── 播放 ─────────────────────────────────────

/**
 * 播放 WAV Buffer
 *
 * 将 Buffer 写入临时文件，通过 play-sound 播放后删除。
 * 如果 play-sound 不可用，使用 PowerShell 播放作为后备方案。
 */
function playWav(wavBuffer: Buffer): void {
  const settings = getSettings()
  if (!settings.soundEnabled) return

  const tmpDir = join(tmpdir(), 'eyetimer-sounds')
  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true })
  }

  const tmpFile = join(tmpDir, `sound-${Date.now()}.wav`)

  try {
    writeFileSync(tmpFile, wavBuffer)

    // 尝试 play-sound
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const play = require('play-sound')({})
      play.play(tmpFile, (err: Error | null) => {
        if (err) {
          log.warn('play-sound failed, trying PowerShell fallback:', err.message)
          playWithPowerShell(tmpFile)
        }
        cleanupFile(tmpFile)
      })
    } catch {
      // play-sound 不可用，使用 PowerShell 后备
      playWithPowerShell(tmpFile)
      setTimeout(() => cleanupFile(tmpFile), 2000)
    }
  } catch (e) {
    log.error('Failed to play sound:', e)
    cleanupFile(tmpFile)
  }
}

/**
 * PowerShell 后备方案（Windows）
 */
function playWithPowerShell(filePath: string): void {
  try {
    const escaped = filePath.replace(/'/g, "''")
    execFile('powershell', [
      '-NoProfile',
      '-Command',
      `(New-Object Media.SoundPlayer '${escaped}').PlaySync()`
    ])
  } catch (e) {
    log.warn('PowerShell audio fallback failed:', e)
  }
}

function cleanupFile(filePath: string): void {
  try {
    if (existsSync(filePath)) unlinkSync(filePath)
  } catch {
    // 忽略清理错误
  }
}

// ─── 公开 API ─────────────────────────────────

/** 播放"开始工作"提示音 */
export function playWorkStart(): void {
  log.info('Sound: work start')
  playWav(getWorkStartWav())
}

/** 播放"休息开始"提示音 */
export function playBreakStart(): void {
  log.info('Sound: break start')
  playWav(getBreakStartWav())
}

/** 播放"休息结束"提示音 */
export function playBreakEnd(): void {
  log.info('Sound: break end')
  playWav(getBreakEndWav())
}
