import { execFile } from 'child_process'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import log from 'electron-log'
import { generateMelody } from './wav'
import { getSettings } from '../storage/settingsStore'

// ─── 提示音定义 ───────────────────────────────
// 每个提示音是一组正弦波音符序列，频率单位 Hz
// 设计原则：醒目但不刺耳，重复播放确保用户注意到

/** 工作开始：上升音调（C5→E5→G5→C6），积极向上，尾音高亮 */
const WORK_START_MELODY = [
  { frequency: 523, duration: 0.18 }, // C5
  { frequency: 659, duration: 0.18 }, // E5
  { frequency: 784, duration: 0.18 }, // G5
  { frequency: 1047, duration: 0.3 } // C6（高音结尾，醒目）
]

/** 工作结束 / 休息开始：下降音调（C6→G5→E5→C5），通知休息 */
const BREAK_START_MELODY = [
  { frequency: 1047, duration: 0.18 }, // C6（高音起始，提醒注意）
  { frequency: 784, duration: 0.18 }, // G5
  { frequency: 659, duration: 0.18 }, // E5
  { frequency: 523, duration: 0.3 } // C5（低音结尾，舒缓）
]

/** 休息结束：温暖的双音（C5→E5→G5），提示回归工作 */
const BREAK_END_MELODY = [
  { frequency: 523, duration: 0.15 }, // C5
  { frequency: 659, duration: 0.15 }, // E5
  { frequency: 784, duration: 0.25 } // G5
]

// ─── 缓存生成的 WAV Buffer ────────────────────

let workStartWav: Buffer | null = null
let breakStartWav: Buffer | null = null
let breakEndWav: Buffer | null = null

function getWorkStartWav(): Buffer {
  if (!workStartWav) {
    workStartWav = generateMelody(WORK_START_MELODY, 0.75)
  }
  return workStartWav
}

function getBreakStartWav(): Buffer {
  if (!breakStartWav) {
    breakStartWav = generateMelody(BREAK_START_MELODY, 0.75)
  }
  return breakStartWav
}

function getBreakEndWav(): Buffer {
  if (!breakEndWav) {
    breakEndWav = generateMelody(BREAK_END_MELODY, 0.7)
  }
  return breakEndWav
}

// ─── 播放 ─────────────────────────────────────

/**
 * 播放 WAV Buffer
 *
 * Windows 上优先使用 PowerShell 播放（兼容性最好），
 * play-sound 作为备选。播放后自动清理临时文件。
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

    // Windows 上优先用 PowerShell（兼容性最好）
    playWithPowerShell(tmpFile)

    // 延迟清理（给 PowerShell 足够时间读取文件）
    setTimeout(() => cleanupFile(tmpFile), 3000)
  } catch (e) {
    log.error('Failed to play sound:', e)
    cleanupFile(tmpFile)
  }
}

/**
 * PowerShell 播放方案（Windows，异步不阻塞）
 */
function playWithPowerShell(filePath: string): void {
  try {
    const escaped = filePath.replace(/'/g, "''")
    // 使用 Play() 而非 PlaySync()，避免阻塞主线程
    const ps = `Add-Type -AssemblyName System.Windows.Forms; $player = New-Object System.Windows.Forms.SoundPlayer '${escaped}'; $player.Play()`
    execFile('powershell', ['-NoProfile', '-Command', ps])
  } catch (e) {
    log.warn('PowerShell audio playback failed:', e)
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

/**
 * 播放提示音，重复 count 次（间隔 intervalMs 毫秒）
 * 确保用户能注意到
 */
function playWavRepeated(wavBuffer: Buffer, count: number = 3, intervalMs: number = 1000): void {
  playWav(wavBuffer)
  for (let i = 1; i < count; i++) {
    setTimeout(() => playWav(wavBuffer), intervalMs * i)
  }
}

/** 播放"开始工作"提示音（重复3次） */
export function playWorkStart(): void {
  log.info('Sound: work start (x3)')
  playWavRepeated(getWorkStartWav(), 3, 1200)
}

/** 播放"休息开始"提示音（重复3次） */
export function playBreakStart(): void {
  log.info('Sound: break start (x3)')
  playWavRepeated(getBreakStartWav(), 3, 1200)
}

/** 播放"休息结束"提示音（重复3次） */
export function playBreakEnd(): void {
  log.info('Sound: break end (x3)')
  playWavRepeated(getBreakEndWav(), 3, 1200)
}
